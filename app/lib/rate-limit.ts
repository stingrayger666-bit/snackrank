import { createHash } from 'node:crypto';
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export function hashKey(value: string) {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

export async function isRateLimited(bucket: string, id: string, limit: number, windowSeconds: number) {
  const key = `${bucket}:${id}`;
  try {
    const rows = await prisma.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimit" ("key", "count", "windowStart")
      VALUES (${key}, 1, NOW())
      ON CONFLICT ("key") DO UPDATE SET
        "count" = CASE
          WHEN "RateLimit"."windowStart" < NOW() - (${windowSeconds}::int * INTERVAL '1 second') THEN 1
          ELSE "RateLimit"."count" + 1
        END,
        "windowStart" = CASE
          WHEN "RateLimit"."windowStart" < NOW() - (${windowSeconds}::int * INTERVAL '1 second') THEN NOW()
          ELSE "RateLimit"."windowStart"
        END
      RETURNING "count"
    `;

    if (Math.random() < 0.01) {
      await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "windowStart" < NOW() - INTERVAL '1 day'`;
    }

    return Number(rows[0]?.count ?? 0) > limit;
  } catch (error) {
    console.error('rate limit check failed:', error);
    return false;
  }
}

export function tooManyRequests() {
  return NextResponse.json({ error: '嘗試次數過多，請稍後再試。' }, { status: 429 });
}