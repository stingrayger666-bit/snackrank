import { NextResponse } from 'next/server';
import { isActivityAdmin } from '@/app/lib/activity-utils';
import { getAuthenticatedUser } from '@/app/lib/auth';

export async function GET() {
  const user = await getAuthenticatedUser();
  return NextResponse.json({ user, isActivityAdmin: user ? isActivityAdmin(user.email) : false });
}