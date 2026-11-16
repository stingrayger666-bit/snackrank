import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import { isActivityAdmin, parseActivityInput } from '@/app/lib/activity-utils';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

type RouteContext = { params: { type: string; id: string } };

export async function PATCH(request: Request, { params }: RouteContext) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: '請先登入管理員帳號。' }, { status: 401 });
  if (!isActivityAdmin(user.email)) {
    return NextResponse.json({ error: '此帳號沒有活動管理權限。' }, { status: 403 });
  }
  if (params.type !== 'raffle' && params.type !== 'reward') {
    return NextResponse.json({ error: '找不到這個活動類型。' }, { status: 404 });
  }

  try {
    const parsed = parseActivityInput(await request.json(), params.type === 'reward');
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const activity = params.type === 'reward'
      ? await prisma.rewardActivity.update({
          where: { id: params.id },
          data: parsed.input,
        })
      : await prisma.raffleActivity.update({
          where: { id: params.id },
          data: {
            name: parsed.input.name,
            points: parsed.input.points,
            isActive: parsed.input.isActive,
            startsAt: parsed.input.startsAt,
            endsAt: parsed.input.endsAt,
          },
        });
    return NextResponse.json({ activity });
  } catch (error) {
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2025'
    ) {
      return NextResponse.json({ error: '找不到這個活動。' }, { status: 404 });
    }
    return NextResponse.json({ error: '無法更新活動，請稍後再試。' }, { status: 503 });
  }
}
