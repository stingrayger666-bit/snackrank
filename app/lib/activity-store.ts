import { prisma } from '@/app/lib/prisma';
import { getCurrentActivityWhere } from '@/app/lib/activity-utils';
import { getLegacyEntityIds, toPublicUserFromPrisma } from '@/app/lib/server-store';

export async function getOpenRaffleActivities(now = new Date()) {
  return prisma.raffleActivity.findMany({
    where: getCurrentActivityWhere(now),
    orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getOpenRewardActivities(now = new Date()) {
  return prisma.rewardActivity.findMany({
    where: getCurrentActivityWhere(now),
    orderBy: [{ startsAt: 'asc' }, { createdAt: 'desc' }],
  });
}

export async function getHomepageStats(now = new Date()) {
  const currentActivityWhere = getCurrentActivityWhere(now);
  const legacyIds = await getLegacyEntityIds();
  const legacyUserIds = [...new Set(legacyIds.userIds)];
  const legacyReviewIds = [...new Set(legacyIds.reviewIds)];
  const [users, reviews, raffles, rewards] = await Promise.all([
    prisma.user.count({
      where: legacyUserIds.length ? { id: { notIn: legacyUserIds } } : undefined,
    }),
    prisma.review.count({
      where: legacyReviewIds.length ? { id: { notIn: legacyReviewIds } } : undefined,
    }),
    prisma.raffleActivity.count({ where: currentActivityWhere }),
    prisma.rewardActivity.count({ where: currentActivityWhere }),
  ]);

  return {
    members: legacyUserIds.length + users,
    reviews: legacyReviewIds.length + reviews,
    raffles,
    rewards,
  };
}

export async function enterRaffleForUser(userId: string, raffleId: string) {
  return prisma.$transaction(async (tx) => {
    const raffle = await tx.raffleActivity.findFirst({
      where: { id: raffleId, ...getCurrentActivityWhere(new Date()) },
    });
    if (!raffle) return { error: 'activity_unavailable' as const };

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'user_not_found' as const };
    if (user.points < raffle.points) {
      return { error: 'insufficient_points' as const, balance: user.points };
    }

    const updatedCount = await tx.user.updateMany({
      where: { id: userId, points: { gte: raffle.points } },
      data: { points: { decrement: raffle.points } },
    });
    if (updatedCount.count === 0) {
      const currentUser = await tx.user.findUnique({ where: { id: userId }, select: { points: true } });
      return { error: 'insufficient_points' as const, balance: currentUser?.points ?? 0 };
    }

    const [updatedUser, entry] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: userId } }),
      tx.raffleEntry.create({
        data: {
          raffleId: raffle.id,
          raffleName: raffle.name,
          userId,
          pointsSpent: raffle.points,
          status: '待抽獎',
        },
      }),
    ]);

    return {
      entry: {
        id: entry.id,
        raffleId: entry.raffleId,
        raffleName: entry.raffleName,
        userId: entry.userId,
        pointsSpent: entry.pointsSpent,
        status: entry.status,
        createdAt: entry.createdAt.toISOString(),
      },
      user: toPublicUserFromPrisma(updatedUser),
    };
  });
}

export async function redeemRewardForUser(userId: string, rewardId: string) {
  return prisma.$transaction(async (tx) => {
    const reward = await tx.rewardActivity.findFirst({
      where: { id: rewardId, ...getCurrentActivityWhere(new Date()) },
    });
    if (!reward) return { error: 'activity_unavailable' as const };

    const user = await tx.user.findUnique({ where: { id: userId } });
    if (!user) return { error: 'user_not_found' as const };
    if (user.points < reward.points) {
      return { error: 'insufficient_points' as const, balance: user.points };
    }

    const updatedCount = await tx.user.updateMany({
      where: { id: userId, points: { gte: reward.points } },
      data: { points: { decrement: reward.points } },
    });
    if (updatedCount.count === 0) {
      const currentUser = await tx.user.findUnique({ where: { id: userId }, select: { points: true } });
      return { error: 'insufficient_points' as const, balance: currentUser?.points ?? 0 };
    }

    const [updatedUser, redemption] = await Promise.all([
      tx.user.findUniqueOrThrow({ where: { id: userId } }),
      tx.redemption.create({
        data: {
          rewardId: reward.id,
          rewardName: reward.name,
          userId,
          pointsSpent: reward.points,
          status: '待核發',
        },
      }),
    ]);

    return {
      redemption: {
        id: redemption.id,
        rewardId: redemption.rewardId,
        rewardName: redemption.rewardName,
        userId: redemption.userId,
        pointsSpent: redemption.pointsSpent,
        status: redemption.status,
        createdAt: redemption.createdAt.toISOString(),
      },
      user: toPublicUserFromPrisma(updatedUser),
    };
  });
}
