import { NextRequest } from 'next/server';

import { auth } from '@/lib/auth';

// Export the GET and POST handlers from auth
export const GET = auth.handler;
export const POST = auth.handler;
