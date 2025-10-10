import express from 'express';
import prisma from './lib/prisma';
import { XService } from './services/x.service';
import { updateTweetStats } from './services/tweet.service';
import cron from 'node-cron';
import { OpenAIService } from './services/open-ai.service';
import { TweetStatus } from '@prisma/client';

const app = express();

// const initalTweets = [
//   'Et si tous les humains se donnaient la main ? 🌍\n\n8 milliards de personnes alignées, main dans la main…\n\nEn comptant environ 1 mètre par personne, la chaîne ferait près de 8 millions de kilomètres !\n\nAssez pour faire 200 fois le tour de la Terre. 🤯\n\nUne humanité littéralement connectée. 🫱🫲\n\n#Science #Humain #Planète',
//   'Et si on comprimait toute la Terre jusqu’à en faire un trou noir ? 🕳️\n\nSon horizon des événements — la limite au-delà de laquelle rien ne peut s’échapper — aurait un rayon d’à peine 9 mm.\n\nToute la planète, réduite à la taille d’une bille. 🌍➡️⚫️\n\nVertigineux, non ? #Astro #Physique #Univers',
//   'Et si on transformait un humain en pure énergie ? ⚡\n\nD’après E = mc², 70 kg de matière contiennent environ 6,3×10¹⁸ joules.\n\nAssez pour alimenter toute la ville de Paris pendant plus de 160 ans ! 💥\n\nL’énergie enfermée dans un seul corps humain… vertigineuse. 🔥\n\n#Physique #Einstein #Science',
//   'Et si on voyageait à 99 % de la vitesse de la lumière ? 🚀\n\nLe trou noir au centre de notre galaxie, Sagittarius A*, se trouve à 27 000 années-lumière.\n\nVu depuis la Terre, le trajet durerait donc 27 000 ans…\n\n…mais pour le voyageur, grâce à la relativité du temps, à peine 1 850 ans s’écouleraient. ✨\n\nLe temps s’étire, l’espace se contracte — bienvenue dans le monde d’Einstein. #Relativité #Physique #Astronomie',
//   'Et si on mettait tous les poissons de l’océan dans un seul aquarium géant ? 🐠\n\nEn tout, les océans abritent environ 2 milliards de tonnes de poissons.\n\nPour les contenir, il faudrait un aquarium plus grand que la France — plus de 600 000 km² ! 😲\n\nDe quoi rappeler à quel point la vie marine est foisonnante… et fragile. 🌊\n\n#Océan #Animaux #Planète',
//   'Et si on prenait un grain de sable pour chaque étoile de la Voie lactée ? 🌌\n\nNotre galaxie compte environ 200 à 400 milliards d’étoiles. ✨\n\nAutant de grains de sable pèseraient près de 3 millions de tonnes, et formeraient une dune de 150 mètres de haut sur un kilomètre de long. 🏜️\n\nUne galaxie entière… tenue dans la paume de la main. 🤯\n\n#Astronomie #Espace #Science',
//   'Et si on essayait de lire tous les tweets publiés dans le monde en une seule journée ? 📝\n\nEnviron 500 millions de tweets sont postés chaque jour. 🐦\n\nMême en lisant un tweet par seconde, il faudrait plus de 15 ans sans s’arrêter.\n\nPour vraiment tout lire (réponses, threads, citations)… plus de 100 ans ! 😵‍💫\n\nLe flux d’infos dépasse largement ce que notre cerveau peut suivre. 💭\n\n#Twitter #Stats #Digital',
//   'Et si on mettait tous les tickets de métro vendus en un an bout à bout ? 🎫\n\nEn Île-de-France, il s’en vendait plus d’un demi-milliard par an avant la fin du ticket papier. 🚇\n\nÀ 6 cm chacun, cela ferait une bande de plus de 30 000 km !\n\nDe quoi relier Paris à New York… et retour. ✈️\n\n#Transport #Stats #FunFacts',
//   'Et si on empilait toutes les tasses de café bues chaque jour dans le monde ? ☕\n\nPlus de 2 milliards de tasses sont consommées chaque jour. 🌍\n\nEmpilées les unes sur les autres, elles formeraient une tour de plus de 50 km de haut — jusqu’à la stratosphère ! 🚀\n\nDe quoi donner un sérieux coup de fouet à la planète. 😅\n\n#Café #FunFacts #Insolite',
// ];

// const populateInitialTweets = async () => {
//   for (const tweet of initalTweets) {
//     await prisma.tweet.create({
//       data: { content: tweet, status: TweetStatus.DRAFT },
//     });
//   }
// };

// populateInitialTweets();

// ✅ Route ping pour "réveiller" l'instance Render
app.get('/keep-alive', (req, res) => {
  console.info('🔄 Keep-alive');
  res.send('OK');
});

// ✅ Route pour mettre à jour les métriques des tweets
app.get('/update-tweet-metrics', async (req, res) => {
  await updateTweetMetrics();
  return res.json({ ok: true, time: new Date().toISOString() });
});

// ✅ Route pour générer un nouveau draft de tweet
app.get('/generate-draft-tweet', async (req, res) => {
  await generateDraftTweet();
  return res.json({ ok: true, time: new Date().toISOString() });
});

// ✅ Route pour publier un tweet
app.get('/post-tweet', async (req, res) => {
  await postTweet();
  return res.json({ ok: true, time: new Date().toISOString() });
});

const updateTweetMetrics = async () => {
  console.info('Mise à jour des métriques…');
  const xService = new XService();

  const tweets = await prisma.tweet.findMany({
    where: { status: TweetStatus.POSTED },
  });

  if (!tweets.length) return;

  const tweetsMetrics = await xService.getTweetMetrics(
    tweets.map((tweet) => tweet.twitterId as string),
  );

  if (!tweetsMetrics) return;

  for (const tweetMetrics of tweetsMetrics) {
    if (!tweetMetrics.id) continue;

    await updateTweetStats(tweetMetrics.id, {
      likeCount: tweetMetrics.public_metrics?.like_count ?? 0,
      retweetCount: tweetMetrics.public_metrics?.retweet_count ?? 0,
      replyCount: tweetMetrics.public_metrics?.reply_count ?? 0,
      impressionCount: tweetMetrics.public_metrics?.impression_count ?? 0,
    });
  }

  console.info('✅ Metrics update terminé');
};

const generateDraftTweet = async () => {
  const draftTweet = await prisma.tweet.findFirst({
    where: { status: TweetStatus.DRAFT },
  });
  if (draftTweet) return;

  console.info('Génération d’un nouveau draft…');
  const openAIService = new OpenAIService();
  await openAIService.generateDraftTweet();
  console.info('✅ Draft généré');
};

const postTweet = async () => {
  console.info('Publication du tweet…');
  const xService = new XService();
  const draftTweet = await prisma.tweet.findFirst({
    where: { status: TweetStatus.DRAFT },
  });

  if (!draftTweet) return;

  const { twitterId } = await xService.postTweet(draftTweet.content);
  if (!twitterId) return;

  console.info('✅ Tweet publié');
  await prisma.tweet.update({
    where: { id: draftTweet.id },
    data: { status: TweetStatus.POSTED, twitterId },
  });
};

// === CRONS INTERNES ===
cron.schedule('0 7 * * *', async () => {
  try {
    await updateTweetMetrics();
  } catch (error) {
    console.error('Error updating tweet metrics:', error);
  }
});

cron.schedule('5 7 * * *', async () => {
  try {
    await generateDraftTweet();
  } catch (error) {
    console.error('Error generating draft tweet:', error);
  }
});

cron.schedule('10 7 * * *', async () => {
  try {
    await postTweet();
  } catch (error) {
    console.error('Error posting tweet:', error);
  }
});

// === Démarrage du serveur ===
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
