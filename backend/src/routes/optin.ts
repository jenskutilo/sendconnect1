import express from 'express';
import { PrismaClient, ContactStatus } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Opt-In Bestätigung
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { optInToken: token },
      include: {
        list: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!contact) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bestätigungslink ungültig</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Bestätigungslink ungültig</h1>
          <p>Der Bestätigungslink ist ungültig oder abgelaufen.</p>
        </body>
        </html>
      `);
    }

    if (contact.status === ContactStatus.SUBSCRIBED) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bereits bestätigt</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Bereits bestätigt</h1>
          <p>Ihre E-Mail-Adresse wurde bereits bestätigt. Sie sind für die Liste "${contact.list.name}" angemeldet.</p>
        </body>
        </html>
      `);
    }

    // Setze Status auf SUBSCRIBED
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        status: ContactStatus.SUBSCRIBED,
        optInToken: null, // Entferne Token nach Bestätigung
      },
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erfolgreich bestätigt</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
        </style>
      </head>
      <body>
        <h1>Erfolgreich bestätigt</h1>
        <p>Ihre E-Mail-Adresse wurde erfolgreich bestätigt.</p>
        <p>Sie sind nun für die Liste "<strong>${contact.list.name}</strong>" angemeldet und erhalten zukünftig E-Mails.</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Opt-in error:', error);
    res.status(500).send('Fehler bei der Bestätigung');
  }
});

export default router;

