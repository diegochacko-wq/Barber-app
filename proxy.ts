import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE_NAME, leerToken } from '@/lib/auth';

export function proxy(request: NextRequest) {
  const partes = request.nextUrl.pathname.split('/').filter(Boolean); // ['admin', slug, ...]
  const slug = partes[1];

  if (!slug) return NextResponse.redirect(new URL('/', request.url));
  if (partes[2] === 'login') return NextResponse.next();

  const sesion = leerToken(request.cookies.get(COOKIE_NAME)?.value);
  if (!sesion || sesion.slug !== slug) {
    return NextResponse.redirect(new URL(`/admin/${slug}/login`, request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};