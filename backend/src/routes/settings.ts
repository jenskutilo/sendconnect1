import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const settingSchema = z.object({
  key: z.string().min(1),
  value: z.any(),
});

// Alle Einstellungen (nur Admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const settings = await prisma.setting.findMany({
      orderBy: {
        key: 'asc',
      },
    });

    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);

    res.json(settingsObj);
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Einstellungen' });
  }
});

// Einstellung nach Key
router.get('/:key', authenticate, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;

    const setting = await prisma.setting.findUnique({
      where: { key },
    });

    if (!setting) {
      return res.status(404).json({ error: 'Einstellung nicht gefunden' });
    }

    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Get setting error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Einstellung' });
  }
});

// Einstellung aktualisieren
router.put('/:key', authenticate, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Wert erforderlich' });
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: { value },
      create: {
        key,
        value,
      },
    });

    res.json({ key: setting.key, value: setting.value });
  } catch (error) {
    console.error('Update setting error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Einstellung' });
  }
});

export default router;

