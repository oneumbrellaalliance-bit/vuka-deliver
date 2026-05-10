// middleware.ts
import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // ── Protected routes ──────────────────────────────────────
  const merchantRoutes = path.startsWith('/merchant')
  const adminRoutes = path.startsWith('/admin')
  const riderRoutes = path.startsWith('/rider')

  if ((merchantRoutes || adminRoutes || riderRoutes) && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirect', path)
    return NextResponse.redirect(loginUrl)
  }

  // ── Role enforcement ──────────────────────────────────────
  if (user && (merchantRoutes || adminRoutes || riderRoutes)) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const role = profile?.role

    if (adminRoutes && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (merchantRoutes && role !== 'merchant' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }

    if (riderRoutes && role !== 'rider' && role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // ── Redirect logged-in users away from auth pages ─────────
  if (user && (path === '/login' || path === '/signup')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
