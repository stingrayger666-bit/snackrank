import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import { isActivityAdmin, parseActivityInput } from '@/app/lib/activity-utils';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

async function authorizeAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: '請先登入管理員帳號。' }, { status: 401 });
  if (!isActivityAdmin(user.email)) {
    return NextResponse.json({ error: '此帳號沒有活動管理權限。' }, { status: 403 });
  }
  return null;
}

export async function GET() {
  const unauthorized = await authorizeAdmin();
  if (unauthorized) return unauthorized;

  try {
    const [raffles, rewards] = await Promise.all([
      prisma.raffleActivity.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.rewardActivity.findMany({ orderBy: { createdAt: 'desc' } }),
    ]);
    return NextResponse.json({ raffles, rewards });
  } catch {
    return NextResponse.json({ error: '無法載入活動資料。' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const unauthorized = await authorizeAdmin();
  if (unauthorized) return unauthorized;

  try {
    const body = await request.json() as { type?: unknown } & Record<string, unknown>;
    if (body.type !== 'raffle' && body.type !== 'reward') {
      return NextResponse.json({ error: '活動類型不正確。' }, { status: 400 });
    }

    const isReward = body.type === 'reward';
    const parsed = parseActivityInput(body, isReward);
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const activity = isReward
      ? await prisma.rewardActivity.create({ data: parsed.input })
      : await prisma.raffleActivity.create({
          data: {
            name: parsed.input.name,
            points: parsed.input.points,
            isActive: parsed.input.isActive,
            startsAt: parsed.input.startsAt,
            endsAt: parsed.input.endsAt,
          },
        });

    return NextResponse.json({ activity }, { status: 201 });
  } catch {
    return NextResponse.json({ error: '無法建立活動，請稍後再試。' }, { status: 503 });
  }
}
