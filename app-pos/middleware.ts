import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const pathname = request.nextUrl.pathname;

  // Routes ที่ต้องการ authentication
  const protectedRoutes = ['/Owner', '/staff', '/api/user'];
  const ownerOnlyRoutes = ['/Owner'];
  const employeeOnlyRoutes = ['/staff'];

  // ตรวจสอบว่าเป็น protected route หรือไม่
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const payload = verifyToken(token) as { userID: string; role: string };
      
      // ตรวจสอบ role สำหรับ Owner routes
      if (ownerOnlyRoutes.some(route => pathname.startsWith(route))) {
        if (payload.role !== 'Owner') {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

      // ตรวจสอบ role สำหรับ Employee routes
      if (employeeOnlyRoutes.some(route => pathname.startsWith(route))) {
        if (payload.role !== 'Staff') {
          return NextResponse.redirect(new URL('/unauthorized', request.url));
        }
      }

    } catch (error) {
      console.error('Token verification failed:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/Owner/:path*',
    '/staff/:path*',
    '/api/user/:path*'
  ]
};