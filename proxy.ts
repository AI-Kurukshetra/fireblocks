import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { hasSupabaseEnv } from '@/lib/supabase/shared'

const authRoutes = ['/login', '/signup']
const protectedPrefixes = ['/dashboard', '/api/v1', '/setup']
const publicApiRoutes = ['/api/v1/billing/webhook']

export async function proxy(request: NextRequest) {
  if (!hasSupabaseEnv()) {
    return NextResponse.next()
  }

  const { supabase, response } = await updateSession(request)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  const isPublicApiRoute = publicApiRoutes.some((route) => pathname === route)
  const isProtected =
    !isPublicApiRoute && protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  const isApiRoute = pathname.startsWith('/api/v1')

  if (isProtected && !user) {
    if (isApiRoute) {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (profile?.organization_id) {
      const { data: organization } = await supabase
        .from('organizations')
        .select('onboarding_status, subscription_status')
        .eq('id', profile.organization_id)
        .maybeSingle()

      const requiresSetup =
        organization?.onboarding_status !== 'complete' ||
        !['active', 'trialing', 'manual'].includes(organization?.subscription_status ?? 'pending')

      if (pathname.startsWith('/dashboard') && requiresSetup) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/setup'
        return NextResponse.redirect(redirectUrl)
      }

      if (pathname.startsWith('/setup') && !requiresSetup) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }

      if (isAuthRoute) {
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = requiresSetup ? '/setup' : '/dashboard'
        return NextResponse.redirect(redirectUrl)
      }
    }
  }

  if (isAuthRoute && user) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/dashboard'
    return NextResponse.redirect(redirectUrl)
  }

  return response
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/v1/:path*', '/setup', '/login', '/signup'],
}
