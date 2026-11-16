import { NextResponse } from 'next/server';
import { getHomepageStats } from '@/app/lib/activity-store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return NextResponse.json(await getHomepageStats());
  } catch {
    return NextResponse.json({ error: '目前無法載入網站統計資料。' }, { status: 503 });
  }
}
