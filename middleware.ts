import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = ['/admin', '/kitchen', '/user', '/delivery'];
const AUTH_PAGES = ['/login', '/register'];

export function middleware(req: NextRequest) {
  const token = req.cookies.get('ak_token')?.value;
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuth = AUTH_PAGES.some((p) => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }
  if (isAuth && token) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*', '/user/:path*', '/delivery/:path*', '/login', '/register'],
};
