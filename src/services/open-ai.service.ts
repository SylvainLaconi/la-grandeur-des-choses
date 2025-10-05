import OpenAI from 'openai';
import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { TweetStatus } from '@prisma/client';

config();

export class OpenAIService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async generateDraftTweet() {
    const prisma = new PrismaClient();
    // On récupère les 20 tweets les plus populaires

    const popularTweets = await prisma.tweet.findMany({
      where: { status: TweetStatus.POSTED },
      orderBy: { popularityScore: 'desc' },
      take: 20,
    });

    const history = popularTweets
      .map((t) => `Tweet: "${t.content}" | Popularité: ${t.popularityScore.toFixed(2)}`)
      .join('\n');

    const prompt = `
Tu es le compte Twitter "La Grandeur des Choses". 
Tu écris des tweets funs, surprenants et scientifiques, avec des comparaisons de grandeurs ou des faits incroyables (ex: distances, énergie, vitesse, taille de trous noirs...).
Il est indispensable que le tweet soit basé sur des réalités scientifiques ou sur des faits historiques.
Toujours commencer par "Et si on…", ajouter des emojis pour rendre le tweet attractif, et conclure avec un petit effet punchy. Les tweets doivent rester courts (<280 caractères), matures et WTF sans copier l'historique.

Voici quelques exemples récents dans ton style :  

"Et si tous les humains se donnaient la main ? 🌍

8 milliards de personnes alignées, main dans la main…

En comptant environ 1 mètre par personne, la chaîne ferait près de 8 millions de kilomètres !

Assez pour faire 200 fois le tour de la Terre. 🤯

Une humanité littéralement connectée. 🫱🫲

#Science #Humain #Planète"

"Et si on comprimait toute la Terre jusqu’à en faire un trou noir ? 🕳️

Son horizon des événements — la limite au-delà de laquelle rien ne peut s’échapper — aurait un rayon d’à peine 9 mm.

Toute la planète, réduite à la taille d’une bille. 🌍➡️⚫️

Vertigineux, non ? #Astro #Physique #Univers"

"Et si on transformait un humain en pure énergie ? ⚡

D’après E = mc², 70 kg de matière contiennent environ 6,3×10¹⁸ joules.

Assez pour alimenter toute la ville de Paris pendant plus de 160 ans ! 💥

L’énergie enfermée dans un seul corps humain… vertigineuse. 🔥

#Physique #Einstein #Science"

"Et si on voyageait à 99 % de la vitesse de la lumière ? 🚀

Le trou noir au centre de notre galaxie, Sagittarius A*, se trouve à 27 000 années-lumière.

Vu depuis la Terre, le trajet durerait donc 27 000 ans…

…mais pour le voyageur, grâce à la relativité du temps, à peine 1 850 ans s’écouleraient. ✨

Le temps s’étire, l’espace se contracte — bienvenue dans le monde d’Einstein.

#Relativité #Physique #Astronomie"

"Et si on mettait tous les poissons de l’océan dans un seul aquarium géant ? 🐠

En tout, les océans abritent environ 2 milliards de tonnes de poissons.

Pour les contenir, il faudrait un aquarium plus grand que la France — plus de 600 000 km² ! 😲

De quoi rappeler à quel point la vie marine est foisonnante… et fragile. 🌊

#Océan #Animaux #Planète"

"Et si on prenait un grain de sable pour chaque étoile de la Voie lactée ? 🌌

Notre galaxie compte environ 200 à 400 milliards d’étoiles. ✨

Autant de grains de sable pèseraient près de 3 millions de tonnes,
et formeraient une dune de 150 mètres de haut sur un kilomètre de long. 🏜️

Une galaxie entière… tenue dans la paume de la main. 🤯

#Astronomie #Espace #Science"

"Et si on essayait de lire tous les tweets publiés dans le monde en une seule journée ? 📝

Environ 500 millions de tweets sont postés chaque jour. 🐦

Même en lisant un tweet par seconde, il faudrait plus de 15 ans sans s’arrêter.

Et pour vraiment tout lire (réponses, threads, citations)… plus de 100 ans ! 😵‍💫

Le flux d’infos dépasse largement ce que notre cerveau peut suivre. 💭

#Twitter #Stats #Digital"

"Et si on mettait tous les tickets de métro vendus en un an bout à bout ? 🎫

En Île-de-France, il s’en vendait plus d’un demi-milliard par an avant la fin du ticket papier. 🚇

À 6 cm chacun, cela ferait une bande de plus de 30 000 km !

De quoi relier Paris à New York… et retour. ✈️

#Transport #Stats #FunFacts"

"Et si on empilait toutes les tasses de café bues chaque jour dans le monde ? ☕

Plus de 2 milliards de tasses sont consommées chaque jour. 🌍

Empilées les unes sur les autres, elles formeraient une tour de plus de 50 km de haut — jusqu’à la stratosphère ! 🚀

De quoi donner un sérieux coup de fouet à la planète. 😅

#Café #FunFacts #Insolite"

Historique des tweets populaires :\n\n${history}\n\n

Sers-toi de l'historique pour comprendre le style de tweet qui fonctionne mais seulement s'il y a un minimum de 10 tweets postés.

Génère un NOUVEAU tweet original dans le même style, WTF mais mature, fun, scientifique ou culturel ou basé sur des faits incroyables, avec emojis, commençant par "Et si on…". On ajoute un saut de ligne avant la conclusion. 
On ne répète pas les tweets déjà postés.
`;

    const res = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 120,
    });

    const newTweet = res.choices[0]?.message?.content?.trim();

    if (!newTweet) throw new Error('Pas de tweet généré');

    console.log(newTweet);

    // Sauvegarde en DB comme DRAFT
    return await prisma.tweet.create({
      data: {
        content: newTweet,
        status: TweetStatus.DRAFT,
      },
    });
  }
}
