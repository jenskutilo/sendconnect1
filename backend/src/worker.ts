import { Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import nodemailer from 'nodemailer';
import { PrismaClient, ContactStatus, BounceType, CampaignStatus } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface EmailJobData {
  campaignId: string;
  contactId: string;
  index: number; // Für Rotation
}

// Rate-Limiting pro SMTP-Profil
const rateLimiters = new Map<string, { count: number; resetAt: number }>();

function getRateLimiter(profileId: string, rateLimit: number): boolean {
  const now = Date.now();
  const limiter = rateLimiters.get(profileId);

  if (!limiter || now > limiter.resetAt) {
    rateLimiters.set(profileId, {
      count: 1,
      resetAt: now + 3600000, // 1 Stunde
    });
    return true;
  }

  if (limiter.count >= rateLimit) {
    return false;
  }

  limiter.count++;
  return true;
}

// Platzhalter ersetzen
function replacePlaceholders(
  content: string,
  contact: any,
  campaign: any,
  trackingBaseUrl: string
): string {
  let result = content;

  // Kontakt-Platzhalter
  result = result.replace(/\{\{first_name\}\}/g, contact.firstName || '');
  result = result.replace(/\{\{last_name\}\}/g, contact.lastName || '');
  result = result.replace(/\{\{email\}\}/g, contact.email);

  // Custom Fields
  if (contact.customFields) {
    Object.keys(contact.customFields).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      result = result.replace(regex, contact.customFields[key] || '');
    });
  }

  // Unsubscribe-Link
  const unsubscribeUrl = `${process.env.UNSUBSCRIBE_BASE_URL || 'http://localhost:3000/api/unsubscribe'}/${contact.unsubscribeToken}`;
  result = result.replace(/\{\{unsubscribe_link\}\}/g, unsubscribeUrl);

  // Tracking-Pixel
  const trackingPixel = `<img src="${trackingBaseUrl}/open/${campaign.id}/${contact.id}" width="1" height="1" style="display:none;" />`;
  result = result.replace(/\{\{tracking_pixel\}\}/g, trackingPixel);

  // Links durch Tracking-Links ersetzen
  const linkRegex = /<a\s+([^>]*href=["']([^"']+)["'][^>]*)>/gi;
  result = result.replace(linkRegex, (match, attrs, url) => {
    const trackingUrl = `${trackingBaseUrl}/click/${campaign.id}/${contact.id}?url=${encodeURIComponent(url)}`;
    return `<a ${attrs.replace(url, trackingUrl)}>`;
  });

  return result;
}

// Betreff/Absender-Rotation
function getRotatedValue<T>(values: T[] | null, index: number): T | null {
  if (!values || values.length === 0) return null;
  return values[index % values.length];
}

async function sendEmail(job: Job<EmailJobData>) {
  const { campaignId, contactId, index } = job.data;

  try {
    // Lade Kampagne
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        smtpProfile: true,
      },
    });

    if (!campaign) {
      throw new Error('Kampagne nicht gefunden');
    }

    // Prüfe Status
    if (campaign.status !== CampaignStatus.SENDING && campaign.status !== CampaignStatus.SCHEDULED) {
      throw new Error('Kampagne ist nicht aktiv');
    }

    // Lade Kontakt
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
    });

    if (!contact) {
      throw new Error('Kontakt nicht gefunden');
    }

    // Prüfe Status
    if (contact.status !== ContactStatus.SUBSCRIBED) {
      throw new Error('Kontakt ist nicht abonniert');
    }

    // Wähle SMTP-Profil
    let smtpProfile = campaign.smtpProfile;
    if (!smtpProfile) {
      // Verwende Standard-Profil
      smtpProfile = await prisma.smtpProfile.findFirst({
        where: {
          userId: campaign.userId,
          isDefault: true,
        },
      });

      if (!smtpProfile) {
        throw new Error('Kein SMTP-Profil gefunden');
      }
    }

    // Rate-Limiting
    if (!getRateLimiter(smtpProfile.id, smtpProfile.rateLimit)) {
      // Job später erneut versuchen
      throw new Error('Rate-Limit erreicht, Job wird später erneut versucht');
    }

    // Betreff-Rotation
    let subject = campaign.subject;
    if (campaign.subjectRotation && Array.isArray(campaign.subjectRotation)) {
      const rotated = getRotatedValue(campaign.subjectRotation as string[], index);
      if (rotated) {
        subject = rotated;
      }
    }

    // Absender-Rotation
    let fromName = campaign.fromName;
    let fromEmail = campaign.fromEmail;
    if (campaign.fromRotation && Array.isArray(campaign.fromRotation)) {
      const rotated = getRotatedValue(campaign.fromRotation as Array<{ name: string; email: string }>, index);
      if (rotated) {
        fromName = rotated.name;
        fromEmail = rotated.email;
      }
    }

    // Ersetze Platzhalter
    const trackingBaseUrl = process.env.TRACKING_BASE_URL || 'http://localhost:3000/api/tracking';
    const htmlContent = replacePlaceholders(campaign.htmlContent, contact, campaign, trackingBaseUrl);
    const textContent = campaign.textContent
      ? replacePlaceholders(campaign.textContent, contact, campaign, trackingBaseUrl)
      : undefined;

    // Erstelle Transporter
    const transporter = nodemailer.createTransport({
      host: smtpProfile.host,
      port: smtpProfile.port,
      secure: smtpProfile.secure,
      auth: {
        user: smtpProfile.authUser,
        pass: smtpProfile.authPass,
      },
    });

    // Sende E-Mail
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: contact.email,
      replyTo: smtpProfile.replyTo || undefined,
      subject: replacePlaceholders(subject, contact, campaign, trackingBaseUrl),
      html: htmlContent,
      text: textContent,
    });

    // Erstelle Send-Eintrag
    await prisma.emailSend.create({
      data: {
        campaignId,
        contactId,
        subject,
        fromName,
        fromEmail,
        status: 'sent',
      },
    });

    console.log(`E-Mail gesendet: ${contact.email} (Campaign: ${campaign.name})`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`Fehler beim Senden der E-Mail (Campaign: ${campaignId}, Contact: ${contactId}):`, error);

    // Erstelle Send-Eintrag mit Fehler
    try {
      await prisma.emailSend.create({
        data: {
          campaignId,
          contactId,
          subject: 'Fehler',
          fromName: '',
          fromEmail: '',
          status: 'failed',
        },
      });
    } catch (e) {
      // Ignoriere Fehler beim Erstellen des Eintrags
    }

    // Prüfe ob es ein Bounce ist
    const errorMessage = error.message?.toLowerCase() || '';
    if (
      errorMessage.includes('bounce') ||
      errorMessage.includes('550') ||
      errorMessage.includes('551') ||
      errorMessage.includes('552') ||
      errorMessage.includes('553') ||
      errorMessage.includes('554')
    ) {
      // Hard Bounce
      await prisma.bounce.create({
        data: {
          campaignId,
          contactId,
          type: BounceType.HARD,
          reason: error.message,
        },
      });

      // Setze Kontakt-Status
      await prisma.contact.update({
        where: { id: contactId },
        data: { status: ContactStatus.BOUNCED },
      });
    }

    // Wirf Fehler erneut, damit BullMQ den Job erneut versucht
    throw error;
  }
}

// Erstelle Worker
const worker = new Worker<EmailJobData>(
  'email-sending',
  async (job) => {
    return await sendEmail(job);
  },
  {
    connection: redis,
    concurrency: 5, // Max 5 E-Mails gleichzeitig
    limiter: {
      max: 100, // Max 100 Jobs pro Minute
      duration: 60000,
    },
  }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} abgeschlossen`);
});

worker.on('failed', (job, err) => {
  console.error(`Job ${job?.id} fehlgeschlagen:`, err.message);
});

worker.on('error', (err) => {
  console.error('Worker-Fehler:', err);
});

console.log('📧 E-Mail-Worker gestartet');

// Graceful Shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM empfangen, beende Worker...');
  await worker.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT empfangen, beende Worker...');
  await worker.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
});

