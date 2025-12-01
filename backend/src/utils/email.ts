import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function sendOptInEmail(contactId: string, listName: string) {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: contactId },
      include: {
        list: true,
      },
    });

    if (!contact || !contact.optInToken) {
      throw new Error('Kontakt oder Opt-In-Token nicht gefunden');
    }

    // Hole Standard-SMTP-Profil (vereinfacht)
    const smtpProfile = await prisma.smtpProfile.findFirst({
      where: {
        isDefault: true,
      },
    });

    if (!smtpProfile) {
      throw new Error('Kein SMTP-Profil gefunden');
    }

    const transporter = nodemailer.createTransport({
      host: smtpProfile.host,
      port: smtpProfile.port,
      secure: smtpProfile.secure,
      auth: {
        user: smtpProfile.authUser,
        pass: smtpProfile.authPass,
      },
    });

    const optInUrl = `${process.env.OPTIN_BASE_URL || 'http://localhost:3000/api/optin'}/${contact.optInToken}`;

    await transporter.sendMail({
      from: `"${smtpProfile.fromName || 'SendConnect'}" <${smtpProfile.fromEmail}>`,
      to: contact.email,
      subject: 'Bitte bestätigen Sie Ihre E-Mail-Adresse',
      html: `
        <h1>Willkommen!</h1>
        <p>Vielen Dank für Ihre Anmeldung zur Liste "${listName}".</p>
        <p>Bitte bestätigen Sie Ihre E-Mail-Adresse, indem Sie auf den folgenden Link klicken:</p>
        <p><a href="${optInUrl}">E-Mail-Adresse bestätigen</a></p>
        <p>Falls Sie sich nicht angemeldet haben, können Sie diese E-Mail ignorieren.</p>
      `,
      text: `Bitte bestätigen Sie Ihre E-Mail-Adresse: ${optInUrl}`,
    });
  } catch (error) {
    console.error('Fehler beim Senden der Opt-In-E-Mail:', error);
    throw error;
  }
}

