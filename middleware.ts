import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/utils/supabase/middleware'
import { createServerClient } from '@supabase/ssr'
import { CookieOptions } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  // update user's auth session
  const response = await updateSession(request)
  
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/signup', '/auth/callback']
  const isPublicPath = publicPaths.some(publicPath => path.startsWith(publicPath))

  // Check if the user is authenticated
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set(name, value, options)
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set(name, '', options)
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // If the user is not authenticated and trying to access a protected route
  if (!user && !isPublicPath) {
    // Redirect to login page
    const redirectUrl = new URL('/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // If the user is authenticated and trying to access login/signup pages
  if (user && isPublicPath) {
    // Redirect to home page
    const redirectUrl = new URL('/', request.url)
    return NextResponse.redirect(redirectUrl)
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
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}