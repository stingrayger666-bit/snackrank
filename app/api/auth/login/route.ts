import { NextResponse } from 'next/server';
import { getClientIpHash, setSessionCookie } from '@/app/lib/auth';
import { authenticateUser } from '@/app/lib/server-store';
import { hashKey, isRateLimited, tooManyRequests } from '@/app/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !password || password.length > 128) {
      return NextResponse.json({ error: '請輸入有效的電子郵件與密碼。' }, { status: 400 });
    }

    const ipHash = getClientIpHash(request);
    if (
      (await isRateLimited('login-ip', ipHash, 10, 600)) ||
      (await isRateLimited('login-email', hashKey(email), 10, 900))
    ) {
      return tooManyRequests();
    }
    
    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ error: '電子郵件或密碼錯誤。' }, { status: 401 });
    }

    const response = NextResponse.json({ user });
    setSessionCookie(response, user.id);
    return response;
  } catch (error) {
    console.error('login failed:', error);
    return NextResponse.json({ error: '無法登入，請稍後再試。' }, { status: 400 });
  }
}