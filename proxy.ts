import { decodeJwt } from 'jose';
import { NextResponse, type NextRequest } from 'next/server';

async function getSession(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return null;
  try {
    const payload = decodeJwt(token);
    // Check if token has expired
    if (payload && payload.exp && payload.exp * 1000 > Date.now()) {
      return payload;
    }
    return null;
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let API requests pass through, the backend will validate the token
  if (pathname.startsWith('/api/')) return NextResponse.next();

  const session = await getSession(request);

  if (!session && pathname.startsWith('/admin') && pathname !== '/admin/login') {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (session && pathname === '/admin/login') {
    return NextResponse.redirect(new URL('/admin', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
