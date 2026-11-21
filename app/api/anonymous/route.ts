import { NextResponse } from 'next/server';
import { getClientIpHash } from '@/app/lib/auth';
import { createAnonymousReservation, redrawAnonymousName } from '@/app/lib/server-store';
import { isRateLimited, tooManyRequests } from '@/app/lib/rate-limit';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
      const ipHash = getClientIpHash(request);
      if (await isRateLimited('anonymous-create', ipHash, 30, 3600)) {
        return tooManyRequests();
      }
      const identity = await createAnonymousReservation(ipHash);
    return NextResponse.json({ identity });
  } catch {
    return NextResponse.json({ error: '目前無法建立匿名名稱，請稍後再試。' }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { reservationId?: unknown };
    if (typeof body.reservationId !== 'string') {
      return NextResponse.json({ error: '匿名名稱預約已失效，請重新取得。' }, { status: 400 });
    }

    const ipHash = getClientIpHash(request);
    if (await isRateLimited('anonymous-redraw', ipHash, 60, 3600)) {
      return tooManyRequests();
    }

    const result = await redrawAnonymousName(ipHash, body.reservationId);
    
    if ('error' in result) {
      const status = result.error === 'redraw_limit' ? 429 : 409;
      const error = result.error === 'redraw_limit'
        ? '匿名名稱最多只能重抽 10 次。'
        : '匿名名稱預約已失效，請重新取得。';
      return NextResponse.json({ error }, { status });
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: '目前無法重新產生匿名名稱，請稍後再試。' }, { status: 503 });
  }
}