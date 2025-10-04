import express from 'express';
import prisma from './lib/prisma';
import { XService } from './services/x.service';
import { updateTweetStats } from './services/tweet.service';
import cron from 'node-cron';
import { OpenAIService } from './services/open-ai.service';
import { PrismaClient, TweetStatus } from '@prisma/client';

const app = express();

// ✅ Route ping pour "réveiller" l'instance Render
app.get('/ping', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// === CRONS INTERNES ===
cron.schedule('0 8 * * *', async () => {
  console.log('Mise à jour des métriques…');
  const tweets = await prisma.tweet.findMany({
    where: { status: TweetStatus.POSTED },
  });

  for (const tweet of tweets) {
    const xService = new XService();
    if (!tweet.twitterId) continue;
    const metrics = await xService.getTweetMetrics(tweet.twitterId);
    if (!metrics) continue;

    await updateTweetStats(tweet.twitterId, metrics);
  }

  console.log('✅ Metrics update terminé');
});

cron.schedule('5 8 * * *', async () => {
  const prisma = new PrismaClient();
  const draftTweet = await prisma.tweet.findFirst({
    where: { status: TweetStatus.DRAFT },
  });
  if (draftTweet) return;

  console.log('Génération d’un nouveau draft…');
  const openAIService = new OpenAIService();
  await openAIService.generateDraftTweet();
  console.log('✅ Draft généré');
});

cron.schedule('10 8 * * *', async () => {
  console.log('Publication du tweet…');
  const xService = new XService();
  const draftTweet = await prisma.tweet.findFirst({
    where: { status: TweetStatus.DRAFT },
  });

  if (!draftTweet) return;

  const { twitterId } = await xService.postTweet(draftTweet.content);
  if (!twitterId) return;

  console.log('✅ Tweet publié');
  await prisma.tweet.update({
    where: { id: draftTweet.id },
    data: { status: TweetStatus.POSTED, twitterId },
  });
});

// === Démarrage du serveur ===
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
