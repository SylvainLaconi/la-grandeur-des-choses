import prisma from '../lib/prisma';
import { TweetStatus } from '../generated/prisma';

export async function createDraftTweet(content: string, scheduledAt?: Date) {
  return prisma.tweet.create({
    data: {
      content,
      status: scheduledAt ? TweetStatus.SCHEDULED : TweetStatus.DRAFT,
      scheduledAt,
    },
  });
}

export async function updateTweetStats(
  twitterId: string,
  stats: {
    likeCount: number;
    retweetCount: number;
    replyCount: number;
    impressionCount: number;
  },
) {
  const popularityScore =
    stats.likeCount * 1 +
    stats.retweetCount * 2 +
    stats.replyCount * 1.5 +
    stats.impressionCount * 0.001;

  return prisma.tweet.update({
    where: { twitterId },
    data: {
      ...stats,
      popularityScore,
    },
  });
}

export async function markAsPosted(id: number, twitterId: string) {
  return prisma.tweet.update({
    where: { id },
    data: {
      twitterId,
      status: TweetStatus.POSTED,
      postedAt: new Date(),
    },
  });
}
