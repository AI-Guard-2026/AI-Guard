import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth()
  const { pathname } = request.nextUrl

  // If logged in and trying to access sign-in/sign-up → go to dashboard
  if (userId && (pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up'))) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If not logged in and accessing protected route → go to sign-in
  if (!userId && !isPublicRoute(request)) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
}