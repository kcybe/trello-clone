import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const result = await auth.api.signOut({
      headers: req.headers,
    });
    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Sign out error:', error);
    return NextResponse.json({ error: 'Sign out failed' }, { status: 400 });
  }
}
