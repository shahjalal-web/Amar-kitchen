import { NextRequest, NextResponse } from 'next/server';

const ROLE_HOME: Record<string, string> = {
  admin: '/admin',
  kitchen: '/kitchen',
  user: '/user',
  delivery: '/delivery',
};
const PROTECTED = ['/admin', '/kitchen', '/user', '/delivery', '/profile'];
const AUTH_PAGES = ['/login', '/register'];
const TOKEN_COOKIE = 'ak_token';

// শুধু রাউটিংয়ের জন্য JWT payload পড়া (signature যাচাই নয় — আসল যাচাই ব্যাকএন্ডে হয়)
function readToken(token?: string): { role: string } | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) return null;
    return ROLE_HOME[payload.role] ? { role: payload.role } : null;
  } catch {
    return null;
  }
}

export function proxy(req: NextRequest) {
  const rawToken = req.cookies.get(TOKEN_COOKIE)?.value;
  const session = readToken(rawToken);
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  const isAuth = AUTH_PAGES.some((p) => pathname.startsWith(p));

  let res: NextResponse;
  if (isProtected && !session) {
    res = NextResponse.redirect(new URL('/login', req.url));
  } else if (isAuth && session) {
    res = NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url));
  } else if (session && !pathname.startsWith('/profile')) {
    // অন্য রোলের ড্যাশবোর্ডে ঢুকতে চাইলে নিজের ড্যাশবোর্ডে পাঠাও
    const foreign = Object.entries(ROLE_HOME).find(
      ([role, home]) => role !== session.role && pathname.startsWith(home)
    );
    res = foreign ? NextResponse.redirect(new URL(ROLE_HOME[session.role], req.url)) : NextResponse.next();
  } else {
    res = NextResponse.next();
  }

  // মেয়াদোত্তীর্ণ/ভাঙা কুকি থেকে গেলে /login ↔ / রিডাইরেক্ট লুপ হয় — মুছে ফেলো
  if (rawToken && !session) res.cookies.delete(TOKEN_COOKIE);
  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/kitchen/:path*', '/user/:path*', '/delivery/:path*', '/profile/:path*', '/login', '/register'],
};
