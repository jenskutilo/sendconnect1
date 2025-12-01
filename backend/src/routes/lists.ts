import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const listSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// Alle Listen
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const lists = await prisma.list.findMany({
      where: {
        userId: req.userId!,
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(lists);
  } catch (error) {
    console.error('Get lists error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Listen' });
  }
});

// Liste nach ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const list = await prisma.list.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
      include: {
        _count: {
          select: {
            contacts: true,
          },
        },
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Liste nicht gefunden' });
    }

    res.json(list);
  } catch (error) {
    console.error('Get list error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Liste' });
  }
});

// Liste erstellen
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = listSchema.parse(req.body);

    const list = await prisma.list.create({
      data: {
        ...data,
        userId: req.userId!,
      },
    });

    res.status(201).json(list);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Create list error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen der Liste' });
  }
});

// Liste aktualisieren
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = listSchema.partial().parse(req.body);

    const list = await prisma.list.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Liste nicht gefunden' });
    }

    const updated = await prisma.list.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Update list error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Liste' });
  }
});

// Liste löschen
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const list = await prisma.list.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Liste nicht gefunden' });
    }

    await prisma.list.delete({
      where: { id },
    });

    res.json({ message: 'Liste erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen der Liste' });
  }
});

export default router;

