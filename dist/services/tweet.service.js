"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDraftTweet = createDraftTweet;
exports.updateTweetStats = updateTweetStats;
exports.markAsPosted = markAsPosted;
const client_1 = require("@prisma/client");
const prisma_1 = __importDefault(require("../lib/prisma"));
async function createDraftTweet(content, scheduledAt) {
    return prisma_1.default.tweet.create({
        data: {
            content,
            status: scheduledAt ? client_1.TweetStatus.SCHEDULED : client_1.TweetStatus.DRAFT,
            scheduledAt,
        },
    });
}
async function updateTweetStats(twitterId, stats) {
    const popularityScore = stats.likeCount * 1 +
        stats.retweetCount * 2 +
        stats.replyCount * 1.5 +
        stats.impressionCount * 0.001;
    return prisma_1.default.tweet.update({
        where: { twitterId },
        data: {
            ...stats,
            popularityScore,
        },
    });
}
async function markAsPosted(id, twitterId) {
    return prisma_1.default.tweet.update({
        where: { id },
        data: {
            twitterId,
            status: client_1.TweetStatus.POSTED,
            postedAt: new Date(),
        },
    });
}
