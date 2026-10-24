import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');
  
  // Get token from localStorage (we'll check this client-side)
  const { pathname } = request.nextUrl;
  
  // Public routes that don't need authentication
  const publicRoutes = ['/login', '/'];
  
  // If trying to access protected route without being on public route
  if (!publicRoutes.includes(pathname)) {
    // We can't check localStorage from middleware, so we'll handle this client-side
    // This middleware just ensures cookies are set properly
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};