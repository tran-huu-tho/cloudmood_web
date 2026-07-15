import { NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email và mật khẩu không được để trống.' }, { status: 400 });
    }

    // Call the NestJS backend login endpoint
    const backendRes = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const backendData = await backendRes.json();

    if (!backendRes.ok) {
      return NextResponse.json(
        { error: backendData.message || 'Email hoặc mật khẩu không đúng.' },
        { status: backendRes.status }
      );
    }

    const { user, token: backendToken } = backendData;

    // Ensure the user has admin role (role: true)
    if (user.role !== true) {
      return NextResponse.json({ error: 'Tài khoản không có quyền truy cập quản trị.' }, { status: 403 });
    }

    const response = NextResponse.json({ success: true });
    
    // Save the backend's JWT token directly into the cookie
    response.cookies.set('admin_session', backendToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error forwarding login to backend:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi kết nối với máy chủ.' }, { status: 500 });
  }
}
