import express from 'express';
import { PrismaClient, ContactStatus } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Unsubscribe-Seite anzeigen
router.get('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { unsubscribeToken: token },
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
          <title>Abmeldung nicht gefunden</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Abmeldung nicht gefunden</h1>
          <p>Der Abmeldelink ist ungültig oder abgelaufen.</p>
        </body>
        </html>
      `);
    }

    if (contact.status === ContactStatus.UNSUBSCRIBED) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Bereits abgemeldet</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Bereits abgemeldet</h1>
          <p>Sie sind bereits von der Liste "${contact.list.name}" abgemeldet.</p>
        </body>
        </html>
      `);
    }

    // Zeige Bestätigungsseite
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Abmeldung bestätigen</title>
        <meta charset="utf-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
          }
          .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 20px;
          }
          .button:hover {
            background-color: #0056b3;
          }
        </style>
      </head>
      <body>
        <h1>Abmeldung bestätigen</h1>
        <p>Möchten Sie sich wirklich von der Liste "<strong>${contact.list.name}</strong>" abmelden?</p>
        <p>Ihre E-Mail-Adresse: <strong>${contact.email}</strong></p>
        <form method="POST" action="/api/unsubscribe/${token}">
          <button type="submit" class="button">Ja, abmelden</button>
        </form>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe page error:', error);
    res.status(500).send('Fehler beim Laden der Abmeldeseite');
  }
});

// Unsubscribe durchführen
router.post('/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const contact = await prisma.contact.findUnique({
      where: { unsubscribeToken: token },
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
          <title>Abmeldung nicht gefunden</title>
          <meta charset="utf-8">
        </head>
        <body>
          <h1>Abmeldung nicht gefunden</h1>
          <p>Der Abmeldelink ist ungültig oder abgelaufen.</p>
        </body>
        </html>
      `);
    }

    // Setze Status auf UNSUBSCRIBED
    await prisma.contact.update({
      where: { id: contact.id },
      data: {
        status: ContactStatus.UNSUBSCRIBED,
      },
    });

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erfolgreich abgemeldet</title>
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
        <h1>Erfolgreich abgemeldet</h1>
        <p>Sie wurden erfolgreich von der Liste "<strong>${contact.list.name}</strong>" abgemeldet.</p>
        <p>Sie erhalten keine weiteren E-Mails von dieser Liste.</p>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    res.status(500).send('Fehler bei der Abmeldung');
  }
});

export default router;

