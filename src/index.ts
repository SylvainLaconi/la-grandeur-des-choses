import prisma from './lib/prisma';
import { XService } from './services/x.service';
import { updateTweetStats } from './services/tweet.service';
import cron from 'node-cron';
import { PrismaClient, TweetStatus } from './generated/prisma';
import { OpenAIService } from './services/open-ai.service';

cron.schedule('0 8 * * *', async () => {
  console.log('Mise à jour des métriques…');
  const tweets = await prisma.tweet.findMany({
    where: { status: TweetStatus.POSTED },
  });

  for (const tweet of tweets) {
    // On récupère les métriques du tweet
    const xService = new XService();
    if (!tweet.twitterId) continue;
    const metrics = await xService.getTweetMetrics(tweet.twitterId);
    if (!metrics) continue;

    // On met à jour les métriques du tweet
    await updateTweetStats(tweet.twitterId, metrics);
  }

  console.log('✅ Metrics update terminé');
});

cron.schedule('15 8 * * *', async () => {
  // Si pas de tweet en DRAFT, on génère un nouveau
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

cron.schedule('30 8 * * *', async () => {
  console.log('Publication du tweet…');
  const xService = new XService();
  const draftTweet = await prisma.tweet.findFirst({
    where: { status: TweetStatus.DRAFT },
  });

  if (!draftTweet) return;

  const { twitterId } = await xService.postTweet(draftTweet.content);

  if (!twitterId) return;
  console.log('✅ Tweet publié');

  // On met à jour le statut du tweet
  await prisma.tweet.update({
    where: { id: draftTweet.id },
    data: { status: TweetStatus.POSTED, twitterId },
  });
});
