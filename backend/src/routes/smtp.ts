import express from 'express';
import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const smtpProfileSchema = z.object({
  name: z.string().min(1),
  host: z.string().min(1),
  port: z.number().int().min(1).max(65535),
  secure: z.boolean(),
  authUser: z.string().min(1),
  authPass: z.string().min(1),
  fromName: z.string().optional(),
  fromEmail: z.string().email(),
  replyTo: z.string().email().optional(),
  rateLimit: z.number().int().min(1).optional(),
  isDefault: z.boolean().optional(),
});

// Alle SMTP-Profile
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const profiles = await prisma.smtpProfile.findMany({
      where: {
        userId: req.userId!,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        fromName: true,
        fromEmail: true,
        replyTo: true,
        rateLimit: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        isDefault: 'desc',
      },
    });

    res.json(profiles);
  } catch (error) {
    console.error('Get SMTP profiles error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der SMTP-Profile' });
  }
});

// SMTP-Profil nach ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        authUser: true,
        fromName: true,
        fromEmail: true,
        replyTo: true,
        rateLimit: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'SMTP-Profil nicht gefunden' });
    }

    res.json(profile);
  } catch (error) {
    console.error('Get SMTP profile error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des SMTP-Profils' });
  }
});

// SMTP-Profil erstellen
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = smtpProfileSchema.parse(req.body);

    // Wenn als Standard markiert, entferne Standard von anderen Profilen
    if (data.isDefault) {
      await prisma.smtpProfile.updateMany({
        where: {
          userId: req.userId!,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const profile = await prisma.smtpProfile.create({
      data: {
        ...data,
        userId: req.userId!,
        rateLimit: data.rateLimit || 100,
      },
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        fromName: true,
        fromEmail: true,
        replyTo: true,
        rateLimit: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Create SMTP profile error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des SMTP-Profils' });
  }
});

// SMTP-Profil aktualisieren
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = smtpProfileSchema.partial().parse(req.body);

    // Prüfe ob Profil existiert und User gehört
    const existing = await prisma.smtpProfile.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'SMTP-Profil nicht gefunden' });
    }

    // Wenn als Standard markiert, entferne Standard von anderen Profilen
    if (data.isDefault) {
      await prisma.smtpProfile.updateMany({
        where: {
          userId: req.userId!,
          isDefault: true,
          NOT: { id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const profile = await prisma.smtpProfile.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        host: true,
        port: true,
        secure: true,
        fromName: true,
        fromEmail: true,
        replyTo: true,
        rateLimit: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(profile);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Update SMTP profile error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des SMTP-Profils' });
  }
});

// SMTP-Profil löschen
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'SMTP-Profil nicht gefunden' });
    }

    await prisma.smtpProfile.delete({
      where: { id },
    });

    res.json({ message: 'SMTP-Profil erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete SMTP profile error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des SMTP-Profils' });
  }
});

// Test-Mail senden
router.post('/:id/test', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { to } = req.body;

    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail-Adresse erforderlich' });
    }

    const profile = await prisma.smtpProfile.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!profile) {
      return res.status(404).json({ error: 'SMTP-Profil nicht gefunden' });
    }

    // Erstelle Transporter
    const transporter = nodemailer.createTransport({
      host: profile.host,
      port: profile.port,
      secure: profile.secure,
      auth: {
        user: profile.authUser,
        pass: profile.authPass,
      },
    });

    // Sende Test-Mail
    await transporter.sendMail({
      from: `"${profile.fromName || 'SendConnect'}" <${profile.fromEmail}>`,
      to,
      subject: 'SendConnect Test-Mail',
      html: `
        <h1>Test-Mail von SendConnect</h1>
        <p>Dies ist eine Test-Mail zur Überprüfung Ihrer SMTP-Einstellungen.</p>
        <p>Wenn Sie diese E-Mail erhalten haben, funktioniert Ihre SMTP-Konfiguration korrekt.</p>
      `,
      text: 'Dies ist eine Test-Mail zur Überprüfung Ihrer SMTP-Einstellungen.',
    });

    res.json({ message: 'Test-Mail erfolgreich gesendet' });
  } catch (error: any) {
    console.error('Test mail error:', error);
    res.status(500).json({
      error: 'Fehler beim Senden der Test-Mail',
      details: error.message,
    });
  }
});

export default router;

