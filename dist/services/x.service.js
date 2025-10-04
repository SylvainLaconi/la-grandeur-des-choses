"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.XService = void 0;
const twitter_api_v2_1 = require("twitter-api-v2");
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)();
class XService {
    constructor() {
        this.client = new twitter_api_v2_1.TwitterApi({
            appKey: process.env.TWITTER_API_KEY,
            appSecret: process.env.TWITTER_API_KEY_SECRET,
            accessToken: process.env.TWITTER_ACCESS_TOKEN,
            accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        });
    }
    async postTweet(content) {
        try {
            const { data } = await this.client.v2.tweet(content);
            return {
                twitterId: data.id,
                text: data.text,
            };
        }
        catch (error) {
            console.error('Error posting tweet:', error);
            throw error;
        }
    }
    async getTweetMetrics(twitterId) {
        try {
            const { data } = await this.client.v2.tweets(twitterId, {
                'tweet.fields': ['public_metrics'],
            });
            const metrics = data?.[0]?.public_metrics;
            if (!metrics)
                return null;
            return {
                likeCount: metrics.like_count,
                retweetCount: metrics.retweet_count,
                replyCount: metrics.reply_count,
                impressionCount: metrics.impression_count,
            };
        }
        catch (error) {
            console.error('Error fetching tweet metrics:', error);
            throw error;
        }
    }
}
exports.XService = XService;
