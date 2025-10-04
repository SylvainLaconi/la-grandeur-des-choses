import { TwitterApi } from 'twitter-api-v2';
import { config } from 'dotenv';

config();

export class XService {
  private client: TwitterApi;

  constructor() {
    this.client = new TwitterApi({
      appKey: process.env.TWITTER_API_KEY!,
      appSecret: process.env.TWITTER_API_KEY_SECRET!,
      accessToken: process.env.TWITTER_ACCESS_TOKEN!,
      accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET!,
    });
  }

  async postTweet(content: string) {
    try {
      const { data } = await this.client.v2.tweet(content);
      return {
        twitterId: data.id,
        text: data.text,
      };
    } catch (error) {
      console.error('Error posting tweet:', error);
      throw error;
    }
  }

  async getTweetMetrics(twitterId: string) {
    try {
      const { data } = await this.client.v2.tweets(twitterId, {
        'tweet.fields': ['public_metrics'],
      });

      const metrics = data?.[0]?.public_metrics;
      if (!metrics) return null;

      return {
        likeCount: metrics.like_count,
        retweetCount: metrics.retweet_count,
        replyCount: metrics.reply_count,
        impressionCount: metrics.impression_count,
      };
    } catch (error) {
      console.error('Error fetching tweet metrics:', error);
      throw error;
    }
  }
}
