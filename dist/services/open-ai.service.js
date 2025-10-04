"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = __importDefault(require("openai"));
const dotenv_1 = require("dotenv");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
(0, dotenv_1.config)();
class OpenAIService {
    constructor() {
        this.openai = new openai_1.default({
            apiKey: process.env.OPENAI_API_KEY,
        });
    }
    async generateDraftTweet() {
        const prisma = new client_1.PrismaClient();
        // On récupère les 20 tweets les plus populaires
        const popularTweets = await prisma.tweet.findMany({
            where: { status: client_2.TweetStatus.POSTED },
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

"Et si on reliait tous les humains par la main ? 🌍 

La chaîne ferait ~8 millions de km… soit 200 fois le tour de la Terre ! 🤯 

#Science #Humain"

"Et si on transformait la Terre en trou noir ? 🕳️

Son horizon des événements ferait à peine 9 mm… une planète entière dans une bille 😱

#Astro #Univers"

"Et si on transformait un humain en énergie ? ⚡

70 kg → assez pour alimenter une ville moyenne pendant ~8 600 ans ! 💥

#Physique #Einstein"

"Et si on voyageait à 99% de la vitesse de la lumière ? 🚀

Pour atteindre le trou noir au centre de la galaxie : ~1 850 ans pour le voyageur ✨

#Relativité #Astronomie"

"Et si on mettait tous les poissons de l’océan dans un aquarium géant ? 🐠

Il faudrait un récipient plus grand que la France pour les contenir 😲

#Océan #Animaux #Incroyable"

"Et si on lisait tous les tweets postés dans le monde en une journée ? 📝

Il faudrait plus de 100 ans sans dormir pour tout lire ! 😵‍💫

#Twitter #Stats #Digital"

"Et si on mettait tous les tickets de métro vendus en un an bout à bout ? 🎫

Ils formeraient une ligne de Paris à New York et retour

#Transport #Stats #FunFacts"

"Et si on empilait toutes les tasses de café consommées par la planète chaque jour ? ☕

La pile atteindrait la stratosphère

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
        if (!newTweet)
            throw new Error('Pas de tweet généré');
        console.log(newTweet);
        // Sauvegarde en DB comme DRAFT
        return await prisma.tweet.create({
            data: {
                content: newTweet,
                status: client_2.TweetStatus.DRAFT,
            },
        });
    }
}
exports.OpenAIService = OpenAIService;
