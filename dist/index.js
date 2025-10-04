"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const prisma_1 = __importDefault(require("./lib/prisma"));
const x_service_1 = require("./services/x.service");
const tweet_service_1 = require("./services/tweet.service");
const node_cron_1 = __importDefault(require("node-cron"));
const open_ai_service_1 = require("./services/open-ai.service");
const client_1 = require("@prisma/client");
const app = (0, express_1.default)();
// ✅ Route ping pour "réveiller" l'instance Render
app.get('/ping', (req, res) => {
    res.json({ ok: true, time: new Date().toISOString() });
});
// === CRONS INTERNES ===
node_cron_1.default.schedule('0 8 * * *', async () => {
    console.log('Mise à jour des métriques…');
    const tweets = await prisma_1.default.tweet.findMany({
        where: { status: client_1.TweetStatus.POSTED },
    });
    for (const tweet of tweets) {
        const xService = new x_service_1.XService();
        if (!tweet.twitterId)
            continue;
        const metrics = await xService.getTweetMetrics(tweet.twitterId);
        if (!metrics)
            continue;
        await (0, tweet_service_1.updateTweetStats)(tweet.twitterId, metrics);
    }
    console.log('✅ Metrics update terminé');
});
node_cron_1.default.schedule('5 8 * * *', async () => {
    const prisma = new client_1.PrismaClient();
    const draftTweet = await prisma.tweet.findFirst({
        where: { status: client_1.TweetStatus.DRAFT },
    });
    if (draftTweet)
        return;
    console.log('Génération d’un nouveau draft…');
    const openAIService = new open_ai_service_1.OpenAIService();
    await openAIService.generateDraftTweet();
    console.log('✅ Draft généré');
});
node_cron_1.default.schedule('10 8 * * *', async () => {
    console.log('Publication du tweet…');
    const xService = new x_service_1.XService();
    const draftTweet = await prisma_1.default.tweet.findFirst({
        where: { status: client_1.TweetStatus.DRAFT },
    });
    if (!draftTweet)
        return;
    const { twitterId } = await xService.postTweet(draftTweet.content);
    if (!twitterId)
        return;
    console.log('✅ Tweet publié');
    await prisma_1.default.tweet.update({
        where: { id: draftTweet.id },
        data: { status: client_1.TweetStatus.POSTED, twitterId },
    });
});
// === Démarrage du serveur ===
const PORT = process.env.PORT || 8001;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
