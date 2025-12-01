import express from 'express';
import { PrismaClient, ContactStatus } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';
import Papa from 'papaparse';
import multer from 'multer';

const router = express.Router();
const prisma = new PrismaClient();

const upload = multer({ storage: multer.memoryStorage() });

const contactSchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  status: z.nativeEnum(ContactStatus).optional(),
  customFields: z.record(z.any()).optional(),
});

// Kontakte einer Liste
router.get('/list/:listId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { listId } = req.params;
    const { page = '1', limit = '50', search, status } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Prüfe ob Liste existiert und User gehört
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        userId: req.userId!,
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Liste nicht gefunden' });
    }

    const where: any = {
      listId,
    };

    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      prisma.contact.count({ where }),
    ]);

    res.json({
      contacts,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kontakte' });
  }
});

// Kontakt erstellen
router.post('/list/:listId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { listId } = req.params;
    const data = contactSchema.parse(req.body);

    // Prüfe ob Liste existiert
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        userId: req.userId!,
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Liste nicht gefunden' });
    }

    // Prüfe ob Kontakt bereits existiert
    const existing = await prisma.contact.findUnique({
      where: {
        listId_email: {
          listId,
          email: data.email,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Kontakt existiert bereits in dieser Liste' });
    }

    const contact = await prisma.contact.create({
      data: {
        ...data,
        listId,
        status: data.status || ContactStatus.SUBSCRIBED,
      },
    });

    res.status(201).json(contact);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Create contact error:', error);
    res.status(500).json({ error: 'Fehler beim Erstellen des Kontakts' });
  }
});

// Kontakt aktualisieren
router.put('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const data = contactSchema.partial().parse(req.body);

    // Prüfe ob Kontakt existiert und zu einer Liste des Users gehört
    const contact = await prisma.contact.findFirst({
      where: {
        id,
        list: {
          userId: req.userId!,
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    }

    // Wenn E-Mail geändert wird, prüfe Duplikat
    if (data.email && data.email !== contact.email) {
      const existing = await prisma.contact.findUnique({
        where: {
          listId_email: {
            listId: contact.listId,
            email: data.email,
          },
        },
      });

      if (existing) {
        return res.status(400).json({ error: 'E-Mail bereits in dieser Liste vorhanden' });
      }
    }

    const updated = await prisma.contact.update({
      where: { id },
      data,
    });

    res.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Update contact error:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren des Kontakts' });
  }
});

// Kontakt löschen
router.delete('/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: {
        id,
        list: {
          userId: req.userId!,
        },
      },
    });

    if (!contact) {
      return res.status(404).json({ error: 'Kontakt nicht gefunden' });
    }

    await prisma.contact.delete({
      where: { id },
    });

    res.json({ message: 'Kontakt erfolgreich gelöscht' });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({ error: 'Fehler beim Löschen des Kontakts' });
  }
});

// CSV-Import
router.post('/list/:listId/import', authenticate, upload.single('file'), async (req: AuthRequest, res) => {
  try {
    const { listId } = req.params;
    const { mapping, skipDuplicates = 'true' } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    // Prüfe ob Liste existiert
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        userId: req.userId!,
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Liste nicht gefunden' });
    }

    // Parse CSV
    const csvContent = req.file.buffer.toString('utf-8');
    const parsed = Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return res.status(400).json({ error: 'CSV-Fehler', details: parsed.errors });
    }

    const mappingObj = typeof mapping === 'string' ? JSON.parse(mapping) : mapping;
    const skipDups = skipDuplicates === 'true';

    let imported = 0;
    let skipped = 0;
    let errors: string[] = [];

    for (const row of parsed.data as any[]) {
      try {
        const email = row[mappingObj.email];
        if (!email || !email.includes('@')) {
          skipped++;
          continue;
        }

        // Prüfe Duplikat
        const existing = await prisma.contact.findUnique({
          where: {
            listId_email: {
              listId,
              email,
            },
          },
        });

        if (existing) {
          if (skipDups) {
            skipped++;
            continue;
          } else {
            // Überschreibe
            await prisma.contact.update({
              where: { id: existing.id },
              data: {
                firstName: mappingObj.firstName ? row[mappingObj.firstName] : existing.firstName,
                lastName: mappingObj.lastName ? row[mappingObj.lastName] : existing.lastName,
                customFields: mappingObj.customFields
                  ? { ...existing.customFields, ...row[mappingObj.customFields] }
                  : existing.customFields,
              },
            });
            imported++;
            continue;
          }
        }

        // Erstelle Kontakt
        await prisma.contact.create({
          data: {
            listId,
            email,
            firstName: mappingObj.firstName ? row[mappingObj.firstName] : undefined,
            lastName: mappingObj.lastName ? row[mappingObj.lastName] : undefined,
            status: ContactStatus.SUBSCRIBED,
            customFields: mappingObj.customFields ? row[mappingObj.customFields] : undefined,
          },
        });

        imported++;
      } catch (error: any) {
        errors.push(`Zeile ${imported + skipped + errors.length + 1}: ${error.message}`);
      }
    }

    res.json({
      imported,
      skipped,
      errors: errors.slice(0, 10), // Max 10 Fehler anzeigen
    });
  } catch (error) {
    console.error('Import contacts error:', error);
    res.status(500).json({ error: 'Fehler beim Importieren der Kontakte' });
  }
});

// CSV-Export
router.get('/list/:listId/export', authenticate, async (req: AuthRequest, res) => {
  try {
    const { listId } = req.params;

    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        userId: req.userId!,
      },
    });

    if (!list) {
      return res.status(404).json({ error: 'Liste nicht gefunden' });
    }

    const contacts = await prisma.contact.findMany({
      where: { listId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const csv = Papa.unparse(
      contacts.map((c) => ({
        email: c.email,
        firstName: c.firstName || '',
        lastName: c.lastName || '',
        status: c.status,
        createdAt: c.createdAt.toISOString(),
      }))
    );

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="contacts-${listId}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export contacts error:', error);
    res.status(500).json({ error: 'Fehler beim Exportieren der Kontakte' });
  }
});

export default router;

