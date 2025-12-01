import express from 'express';
import { PrismaClient, CampaignStatus, ContactStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

const router = express.Router();
const prisma = new PrismaClient();

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const emailQueue = new Queue('email-sending', { connection: redis });

const campaignSchema = z.object({
  name: z.string().min(1),
  listId: z.string().uuid().optional(),
  segmentId: z.string().uuid().optional(),
  templateId: z.string().uuid().optional(),
  smtpProfileId: z.string().uuid().optional(),
  subject: z.string().min(1),
  subjectRotation: z.array(z.string()).optional(),
  fromName: z.string().min(1),
  fromEmail: z.string().email(),
  fromRotation: z.array(z.object({
    name: z.string(),
    email: z.string().email(),
  })).optional(),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  preheader: z.string().optional(),
  scheduledAt: z.string().datetime().optional(),
});

// Alle Kampagnen
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: req.userId!,
      },
      include: {
        list: {
          select: {
            id: true,
            name: true,
          },
        },
        template: {
          select: {
            id: true,
            name: true,
          },
        },
        smtpProfile: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            sends: true,
            opens: true,
            clicks: true,
            bounces: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(campaigns);
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kampagnen' });
  }
});

// Kampagne nach ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
      include: {
        list: true,
        template: true,
        smtpProfile: true,
        _count: {
          select: {
            sends: true,
            opens: true,
            clicks: true,
            bounces: true,
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    res.json(campaign);
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kampagne' });
  }
});

// Kampagne erstellen
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = campaignSchema.parse(req.body);

    // Prüfe ob Liste existiert (falls angegeben)
    if (data.listId) {
      const list = await prisma.list.findFirst({
        where: {
          id: data.listId,
          userId: req.userId!,
        },
      });

      if (!list) {
        return res.status(404).json({ error: 'Liste nicht gefunden' });
      }
    }

    // Prüfe ob Template existiert (falls angegeben)
    if (data.templateId) {
      const template = await prisma.template.findFirst({
        where: {
          id: data.templateId,
          userId: req.userId!,
        },
      });

      if (!template) {
        return res.status(404).json({ error: 'Template nicht gefunden' });
      }
    }

    // Prüfe ob SMTP-Profil existiert (falls angegeben)
    if (data.smtpProfileId) {
      const smtpProfile = await prisma.smtpProfile.findFirst({
        where: {
          id: data.smtpProfileId,
          userId: req.userId!,
        },
      });

      if (!smtpProfile) {
        return res.status(404).json({ error: 'SMTP-Profil nicht gefunden' });
      }
    }

    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : null;

    const campaign = await prisma.campaign.create({
      data: {
        name: data.name,
        userId: req.userId!,
        listId: data.listId || null,
        segmentId: data.segmentId || null,
        templateId: data.templateId || null,
        smtpProfileId: data.smtpProfileId || null,
        status: scheduledAt ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
        subject: data.subject,
        subjectRotation: data.subjectRotation || null,
        fromName: data.fromName,
        fromEmail: data.fromEmail,
        fromRotation: data.fromRotation || null,
        htmlContent: data.htmlContent,
        textContent: data.textContent || null,
        preheader: data.preheader || null,
        scheduledAt: scheduledAt,
      },
    });

    res.status(201).json(campaign);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Kampagne' });
  }
});

// Kampagne aktualisieren
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = campaignSchema.partial().parse(req.body);

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    // Nur DRAFT oder SCHEDULED können bearbeitet werden
    if (![CampaignStatus.DRAFT, CampaignStatus.SCHEDULED].includes(campaign.status)) {
      return res.status(400).json({ error: 'Kampagne kann nicht mehr bearbeitet werden' });
    }

    const scheduledAt = data.scheduledAt ? new Date(data.scheduledAt) : campaign.scheduledAt;

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        ...data,
        scheduledAt: scheduledAt || null,
        status: scheduledAt && scheduledAt > new Date() ? CampaignStatus.SCHEDULED : CampaignStatus.DRAFT,
      },
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Kampagne' });
  }
});

// Kampagne löschen
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    // Nur DRAFT, SCHEDULED oder CANCELLED können gelöscht werden
    if ([CampaignStatus.SENDING, CampaignStatus.FINISHED].includes(campaign.status)) {
      return res.status(400).json({ error: 'Kampagne kann nicht gelöscht werden' });
    }

    await prisma.campaign.delete({
      where: { id },
    });

    res.json({ message: 'Kampagne erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete campaign error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Kampagne' });
  }
});

// Kampagne starten
router.post('/:id/start', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
      include: {
        list: {
          include: {
            contacts: {
              where: {
                status: ContactStatus.SUBSCRIBED,
              },
            },
          },
        },
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED) {
      return res.status(400).json({ error: 'Kampagne kann nicht gestartet werden' });
    }

    if (!campaign.list) {
      return res.status(400).json({ error: 'Keine Liste zugeordnet' });
    }

    // Aktualisiere Status
    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.SENDING,
        sentAt: new Date(),
      },
    });

    // Erstelle Jobs für jeden Kontakt
    const contacts = campaign.list.contacts;
    const jobs = contacts.map((contact, index) => ({
      name: 'send-email',
      data: {
        campaignId: campaign.id,
        contactId: contact.id,
        index, // Für Rotation
      },
    }));

    await emailQueue.addBulk(jobs);

    res.json({ message: 'Kampagne gestartet', jobsCreated: jobs.length });
  } catch (error) {
    console.error('Start campaign error:', error);
    res.status(500).json({ error: 'Fehler beim Starten der Kampagne' });
  }
});

// Kampagne pausieren
router.post('/:id/pause', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    if (campaign.status !== CampaignStatus.SENDING) {
      return res.status(400).json({ error: 'Kampagne kann nicht pausiert werden' });
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.PAUSED,
      },
    });

    // Entferne Jobs aus Queue (vereinfacht - in Produktion besser mit Job-Tags)
    // TODO: Implementiere Job-Pausierung

    res.json({ message: 'Kampagne pausiert' });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({ error: 'Fehler beim Pausieren der Kampagne' });
  }
});

// Kampagne abbrechen
router.post('/:id/cancel', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const campaign = await prisma.campaign.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Kampagne nicht gefunden' });
    }

    await prisma.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.CANCELLED,
      },
    });

    res.json({ message: 'Kampagne abgebrochen' });
  } catch (error) {
    console.error('Cancel campaign error:', error);
    res.status(500).json({ error: 'Fehler beim Abbrechen der Kampagne' });
  }
});

export default router;

