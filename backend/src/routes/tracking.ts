import express from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const router = express.Router();
const prisma = new PrismaClient();

// Open-Tracking (1x1 Pixel)
router.get('/open/:campaignId/:contactId', async (req, res) => {
  try {
    const { campaignId, contactId } = req.params;

    // Prüfe ob Send existiert
    const send = await prisma.emailSend.findFirst({
      where: {
        campaignId,
        contactId,
      },
    });

    if (!send) {
      return res.status(404).send('Not found');
    }

    // Erstelle Open-Eintrag (prüfe ob bereits vorhanden)
    const existing = await prisma.emailOpen.findFirst({
      where: {
        campaignId,
        contactId,
      },
      orderBy: {
        openedAt: 'desc',
      },
    });

    // Nur erstellen wenn noch nicht vorhanden oder letzte Öffnung > 1 Stunde her
    if (!existing || (existing.openedAt.getTime() < Date.now() - 3600000)) {
      await prisma.emailOpen.create({
        data: {
          campaignId,
          contactId,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || undefined,
        },
      });
    }

    // Aktualisiere lastOpen beim Kontakt
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastOpen: new Date() },
    });

    // 1x1 transparentes PNG
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.send(pixel);
  } catch (error) {
    console.error('Open tracking error:', error);
    // Sende trotzdem Pixel, damit Mail nicht kaputt aussieht
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    res.setHeader('Content-Type', 'image/png');
    res.send(pixel);
  }
});

// Click-Tracking (Redirect)
router.get('/click/:campaignId/:contactId', async (req, res) => {
  try {
    const { campaignId, contactId } = req.params;
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).send('URL-Parameter fehlt');
    }

    // Decodiere URL
    const decodedUrl = decodeURIComponent(url);

    // Prüfe ob Send existiert
    const send = await prisma.emailSend.findFirst({
      where: {
        campaignId,
        contactId,
      },
    });

    if (!send) {
      // Redirect trotzdem, aber ohne Tracking
      return res.redirect(decodedUrl);
    }

    // Erstelle Click-Eintrag
    await prisma.emailClick.create({
      data: {
        campaignId,
        contactId,
        originalUrl: decodedUrl,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || undefined,
      },
    });

    // Aktualisiere lastClick beim Kontakt
    await prisma.contact.update({
      where: { id: contactId },
      data: { lastClick: new Date() },
    });

    // Redirect zur Ziel-URL
    res.redirect(decodedUrl);
  } catch (error) {
    console.error('Click tracking error:', error);
    // Redirect trotzdem
    const url = req.query.url;
    if (url && typeof url === 'string') {
      res.redirect(decodeURIComponent(url));
    } else {
      res.status(400).send('Fehler beim Tracking');
    }
  }
});

export default router;

