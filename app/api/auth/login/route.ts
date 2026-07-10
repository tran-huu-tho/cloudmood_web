import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
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

    if (!user.role) {
      return NextResponse.json({ error: 'Tài khoản không có quyền truy cập.' }, { status: 403 });
    }

    const token = await new SignJWT({
      sub: String(user.id),
      email: user.email,
      fullName: user.fullName,
      backendToken: backendToken,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(secret);

    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_session', token, {
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
