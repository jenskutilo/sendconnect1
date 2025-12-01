import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

const templateSchema = z.object({
  name: z.string().min(1),
  subject: z.string().optional(),
  htmlContent: z.string().min(1),
  textContent: z.string().optional(),
  preheader: z.string().optional(),
});

// Alle Templates
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const templates = await prisma.template.findMany({
      where: {
        userId: req.userId!,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Templates' });
  }
});

// Template nach ID
router.get('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template nicht gefunden' });
    }

    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des Templates' });
  }
});

// Template erstellen
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = templateSchema.parse(req.body);

    const template = await prisma.template.create({
      data: {
        ...data,
        userId: req.userId!,
      },
    });

    res.status(201).json(template);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Templates' });
  }
});

// Template aktualisieren
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = templateSchema.partial().parse(req.body);

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template nicht gefunden' });
    }

    const updated = await prisma.template.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Templates' });
  }
});

// Template löschen
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template nicht gefunden' });
    }

    await prisma.template.delete({
      where: { id },
    });

    res.json({ message: 'Template erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Templates' });
  }
});

// Test-Mail mit Template
router.post('/:id/test', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { to, variables } = req.body;

    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'Gültige E-Mail-Adresse erforderlich' });
    }

    const template = await prisma.template.findFirst({
      where: {
        id,
        userId: req.userId!,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template nicht gefunden' });
    }

    // Ersetze Platzhalter
    let htmlContent = template.htmlContent;
    let textContent = template.textContent || '';
    let subject = template.subject || 'Test-Mail';

    const vars = variables || {};
    Object.keys(vars).forEach((key) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      htmlContent = htmlContent.replace(regex, vars[key]);
      textContent = textContent.replace(regex, vars[key]);
      subject = subject.replace(regex, vars[key]);
    });

    // Standard-Platzhalter
    htmlContent = htmlContent.replace(/\{\{email\}\}/g, to);
    textContent = textContent.replace(/\{\{email\}\}/g, to);
    subject = subject.replace(/\{\{email\}\}/g, to);

    res.json({
      subject,
      htmlContent,
      textContent,
      message: 'Template-Vorschau generiert (nicht gesendet)',
    });
  } catch (error) {
    console.error('Test template error:', error);
    res.status(500).json({ error: 'Fehler beim Testen des Templates' });
  }
});

export default router;

