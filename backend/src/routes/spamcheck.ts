import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { z } from 'zod';

const router = express.Router();

const spamCheckSchema = z.object({
  subject: z.string(),
  htmlContent: z.string(),
  textContent: z.string().optional(),
});

interface SpamCheckResult {
  score: number; // 0-100, niedriger = besser
  rating: 'gut' | 'verbesserungswürdig' | 'schlecht';
  issues: string[];
  recommendations: string[];
}

function checkSpamScore(subject: string, htmlContent: string, textContent?: string): SpamCheckResult {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 0;

  // Prüfe Betreff
  const upperCaseRatio = (subject.match(/[A-Z]/g) || []).length / Math.max(subject.length, 1);
  if (upperCaseRatio > 0.5) {
    issues.push('Betreff enthält zu viele Großbuchstaben');
    score += 15;
    recommendations.push('Verwenden Sie weniger Großbuchstaben im Betreff');
  }

  // Prüfe Ausrufezeichen
  const exclamationCount = (subject.match(/!/g) || []).length;
  if (exclamationCount > 2) {
    issues.push('Betreff enthält zu viele Ausrufezeichen');
    score += 10;
    recommendations.push('Verwenden Sie maximal 1-2 Ausrufezeichen');
  }

  // Prüfe Spam-Wörter (vereinfacht)
  const spamWords = ['gratis', 'kostenlos', 'gewinnen', 'jetzt kaufen', 'limited time', 'act now'];
  const subjectLower = subject.toLowerCase();
  const htmlLower = htmlContent.toLowerCase();
  const foundSpamWords = spamWords.filter(word => 
    subjectLower.includes(word) || htmlLower.includes(word)
  );
  if (foundSpamWords.length > 0) {
    issues.push(`Mögliche Spam-Wörter gefunden: ${foundSpamWords.join(', ')}`);
    score += foundSpamWords.length * 5;
    recommendations.push('Vermeiden Sie aggressive Marketing-Begriffe');
  }

  // Prüfe Unsubscribe-Link
  const hasUnsubscribeLink = 
    htmlContent.includes('{{unsubscribe_link}}') ||
    htmlContent.includes('unsubscribe') ||
    htmlContent.includes('abmelden');
  
  if (!hasUnsubscribeLink) {
    issues.push('Kein Abmeldelink gefunden');
    score += 25;
    recommendations.push('Fügen Sie einen Abmeldelink hinzu ({{unsubscribe_link}})');
  }

  // Prüfe Text-Version
  if (!textContent || textContent.trim().length < 50) {
    issues.push('Keine oder zu kurze Text-Version');
    score += 15;
    recommendations.push('Fügen Sie eine Text-Version der E-Mail hinzu');
  }

  // Prüfe HTML/Text-Verhältnis
  const textLength = textContent?.length || 0;
  const htmlTextLength = htmlContent.replace(/<[^>]*>/g, '').length;
  const textRatio = textLength / Math.max(htmlTextLength, 1);
  
  if (textRatio < 0.3) {
    issues.push('Zu wenig Text-Inhalt im Verhältnis zu HTML');
    score += 10;
    recommendations.push('Erhöhen Sie den Textanteil der E-Mail');
  }

  // Prüfe Links
  const linkCount = (htmlContent.match(/<a[^>]*>/g) || []).length;
  if (linkCount > 10) {
    issues.push('Zu viele Links in der E-Mail');
    score += 10;
    recommendations.push('Reduzieren Sie die Anzahl der Links');
  }

  // Prüfe Bilder
  const imageCount = (htmlContent.match(/<img[^>]*>/g) || []).length;
  if (imageCount > 5 && textLength < 100) {
    issues.push('Zu viele Bilder, zu wenig Text');
    score += 10;
    recommendations.push('Fügen Sie mehr Text-Inhalt hinzu');
  }

  // Bestimme Rating
  let rating: 'gut' | 'verbesserungswürdig' | 'schlecht';
  if (score < 20) {
    rating = 'gut';
  } else if (score < 50) {
    rating = 'verbesserungswürdig';
  } else {
    rating = 'schlecht';
  }

  return {
    score: Math.min(score, 100),
    rating,
    issues,
    recommendations,
  };
}

// Spam-Check durchführen
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const data = spamCheckSchema.parse(req.body);

    const result = checkSpamScore(data.subject, data.htmlContent, data.textContent);

    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Ungültige Daten', details: error.errors });
    }
    console.error('Spam check error:', error);
    res.status(500).json({ error: 'Fehler beim Spam-Check' });
  }
});

export default router;

