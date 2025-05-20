import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // Enhanced cookie security options
            const secureOptions = {
              ...options,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: '/',
            }
            response.cookies.set({
              name,
              value,
              ...secureOptions,
            })
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({
              name,
              value: '',
              ...options,
              path: '/',
            })
          },
        },
      }
    )

    // Refresh session if it exists
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Auth error:', error.message)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    const path = request.nextUrl.pathname

    // Define public paths that don't require authentication
    const publicPaths = [
      '/login', 
      '/signup', 
      '/auth/callback',
      '/auth/confirm',
      '/auth/reset-password',
      '/api/auth',
      '/_next',
      '/static',
      '/favicon.ico',
      '/logo.png',
      '/manifest.json',
      '/robots.txt'
    ]
    
    const isPublicPath = publicPaths.some(publicPath => 
      path.startsWith(publicPath) || 
      path.match(/\.(ico|png|jpg|jpeg|svg|css|js|json)$/)
    )

    // If the user is not authenticated and trying to access a protected route
    if (!session && !isPublicPath) {
      const redirectUrl = new URL('/login', request.url)
      redirectUrl.searchParams.set('redirectTo', path)
      return NextResponse.redirect(redirectUrl)
    }

    // If the user is authenticated and trying to access login/signup pages
    if (session && isPublicPath && !path.match(/\.(ico|png|jpg|jpeg|svg|css|js|json)$/)) {
      const redirectUrl = new URL('/', request.url)
      return NextResponse.redirect(redirectUrl)
    }

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|json)$).*)',
  ],
}