// middleware.ts (place in your root directory)
import { createServerSupabaseClient } from './src/lib/supabaseServerClient'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Use the same server-side Supabase client as the rest of the app
  const supabase = await createServerSupabaseClient()

  // Refresh session if expired - required for Server Components
  await supabase.auth.getUser()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedPaths = []
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(path + '/')
  )

  // Auth routes that should redirect if already authenticated
  const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtectedPath && !session) {
    // Redirect to login if trying to access protected route without session
    const redirectUrl = new URL('/login', request.url)
    redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (isAuthPath && session) {
    // Redirect to home if trying to access auth pages while authenticated
    return NextResponse.redirect(new URL('/', request.url))
  }

  // Check session expiry
  if (session) {
    const now = Math.floor(Date.now() / 1000)
    if (session.expires_at && session.expires_at < now) {
      // Session expired, redirect to login
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('message', 'Session expired')
      if (isProtectedPath) {
        redirectUrl.searchParams.set('redirectTo', request.nextUrl.pathname)
      }
      
      // Clear the session
      await supabase.auth.signOut()
      
      return NextResponse.redirect(redirectUrl)
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public|api).*)',
  ],
}