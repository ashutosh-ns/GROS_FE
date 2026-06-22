import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = ['/', '/login', '/register', '/scan'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some((path) => pathname === path || pathname.startsWith('/scan'))) {
    return NextResponse.next();
  }

  // Allow customer routes (session-based, not JWT)
  if (pathname.startsWith('/menu') || pathname.startsWith('/cart') || pathname.startsWith('/order') || pathname.startsWith('/feedback')) {
    return NextResponse.next();
  }

  // Dashboard and admin routes require auth (checked client-side via store)
  // Server-side middleware can't check Zustand store, so we let it through
  // and handle redirect in the layout component
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
