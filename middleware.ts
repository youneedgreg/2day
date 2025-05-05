// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from '@/lib/utils/supabase/client';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });
  
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Protected routes
  const protectedPaths = [
    '/dashboard',
    '/habits',
    '/todos',
    '/reminders',
    '/notes',
    '/calendar',
    '/activity',
    '/profile',
  ];

  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  );

  // If accessing a protected route without a session, redirect to login
  if (isProtectedPath && !session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/login';
    redirectUrl.searchParams.set('from', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // If accessing login/signup while logged in, redirect to dashboard
  if ((req.nextUrl.pathname === '/login' || req.nextUrl.pathname === '/signup') && session) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = '/dashboard';
    return NextResponse.redirect(redirectUrl);
  }
  
  return res;
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/habits/:path*',
    '/todos/:path*',
    '/reminders/:path*',
    '/notes/:path*',
    '/calendar/:path*',
    '/activity/:path*',
    '/profile/:path*',
    '/login',
    '/signup',
  ],
};