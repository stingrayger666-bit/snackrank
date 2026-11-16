import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/app/lib/auth';
import { getOpenRaffleActivities, enterRaffleForUser } from '@/app/lib/activity-store';
import { getPointActivities } from '@/app/lib/server-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  const user = await getAuthenticatedUser();
  try {
    const [raffles, activities] = await Promise.all([
      getOpenRaffleActivities(),
      user ? getPointActivities(user.id) : Promise.resolve({ raffleEntries: [] }),
    ]);
    return NextResponse.json({ user, raffles, entries: activities.raffleEntries });
  } catch {
    return NextResponse.json({ error: '目前無法載入抽獎活動。' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) return NextResponse.json({ error: '請先登入會員。' }, { status: 401 });

  try {
    const body = (await request.json()) as { raffleId?: unknown };
    if (typeof body.raffleId !== 'string') {
      return NextResponse.json({ error: '請選擇有效的抽獎活動。' }, { status: 400 });
    }

    const result = await enterRaffleForUser(user.id, body.raffleId);
    if ('error' in result) {
      if (result.error === 'activity_unavailable') {
        return NextResponse.json({ error: '此抽獎活動已結束或尚未開放。' }, { status: 404 });
      }
      if (result.error === 'insufficient_points') {
        return NextResponse.json({ error: '積分不足，請先累積點數。', balance: result.balance }, { status: 400 });
      }
      return NextResponse.json({ error: '會員資料不存在，請重新登入。' }, { status: 401 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch {
    return NextResponse.json({ error: '無法參加抽獎，請稍後再試。' }, { status: 503 });
  }
}