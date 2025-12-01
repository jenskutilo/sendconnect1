import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Dashboard-Statistiken
router.get('/dashboard', authenticate, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;

    // Kontakte gesamt
    const totalContacts = await prisma.contact.count({
      where: {
        list: {
          userId,
        },
      },
    });

    // Listen gesamt
    const totalLists = await prisma.list.count({
      where: { userId },
    });

    // Kampagnen gesamt
    const totalCampaigns = await prisma.campaign.count({
      where: { userId },
    });

    // Versendete Mails (letzte 30 Tage)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sentLast30Days = await prisma.emailSend.count({
      where: {
        campaign: {
          userId,
        },
        sentAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Öffnungen (letzte 30 Tage)
    const opensLast30Days = await prisma.emailOpen.count({
      where: {
        campaign: {
          userId,
        },
        openedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Klicks (letzte 30 Tage)
    const clicksLast30Days = await prisma.emailClick.count({
      where: {
        campaign: {
          userId,
        },
        clickedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Durchschnittliche Öffnungsrate
    const openRate = sentLast30Days > 0 ? (opensLast30Days / sentLast30Days) * 100 : 0;

    // Durchschnittliche Klickrate
    const clickRate = sentLast30Days > 0 ? (clicksLast30Days / sentLast30Days) * 100 : 0;

    // Tagesstatistiken (letzte 30 Tage)
    const dailyStats = await prisma.$queryRaw<Array<{
      date: Date;
      sent: bigint;
      opens: bigint;
      clicks: bigint;
    }>>`
      SELECT 
        DATE(sent_at) as date,
        COUNT(DISTINCT es.id) as sent,
        COUNT(DISTINCT eo.id) as opens,
        COUNT(DISTINCT ec.id) as clicks
      FROM email_sends es
      LEFT JOIN campaigns c ON es.campaign_id = c.id
      LEFT JOIN email_opens eo ON eo.campaign_id = es.campaign_id AND DATE(eo.opened_at) = DATE(es.sent_at)
      LEFT JOIN email_clicks ec ON ec.campaign_id = es.campaign_id AND DATE(ec.clicked_at) = DATE(es.sent_at)
      WHERE c.user_id = ${userId}
        AND es.sent_at >= ${thirtyDaysAgo}
      GROUP BY DATE(es.sent_at)
      ORDER BY date ASC
    `;

    res.json({
      overview: {
        totalContacts,
        totalLists,
        totalCampaigns,
        sentLast30Days,
        opensLast30Days,
        clicksLast30Days,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      },
      dailyStats: dailyStats.map((stat) => ({
        date: stat.date,
        sent: Number(stat.sent),
        opens: Number(stat.opens),
        clicks: Number(stat.clicks),
      })),
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Statistiken' });
  }
});

// Kampagnen-Statistiken
router.get('/campaign/:id', authenticate, async (req: AuthRequest, res) => {
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

    const [sends, opens, clicks, bounces] = await Promise.all([
      prisma.emailSend.count({
        where: { campaignId: id },
      }),
      prisma.emailOpen.count({
        where: { campaignId: id },
      }),
      prisma.emailClick.count({
        where: { campaignId: id },
      }),
      prisma.bounce.count({
        where: { campaignId: id },
      }),
    ]);

    const uniqueOpens = await prisma.emailOpen.groupBy({
      by: ['contactId'],
      where: { campaignId: id },
    });

    const uniqueClicks = await prisma.emailClick.groupBy({
      by: ['contactId'],
      where: { campaignId: id },
    });

    const openRate = sends > 0 ? (uniqueOpens.length / sends) * 100 : 0;
    const clickRate = sends > 0 ? (uniqueClicks.length / sends) * 100 : 0;

    res.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status,
      },
      stats: {
        sent: sends,
        opens: opens,
        uniqueOpens: uniqueOpens.length,
        clicks: clicks,
        uniqueClicks: uniqueClicks.length,
        bounces,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Campaign stats error:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Kampagnen-Statistiken' });
  }
});

export default router;

