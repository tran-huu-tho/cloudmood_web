import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { createClient } from '@/lib/supabase/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email và mật khẩu không được để trống.' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: users, error } = await supabase
      .from('User')
      .select('id, email, password, role, fullName, avatar')
      .eq('email', email)
      .limit(1);

    if (error || !users || users.length === 0) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng.' }, { status: 401 });
    }

    const user = users[0];

    if (!user.role) {
      return NextResponse.json({ error: 'Tài khoản không có quyền truy cập.' }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password ?? '');
    if (!valid) {
      return NextResponse.json({ error: 'Email hoặc mật khẩu không đúng.' }, { status: 401 });
    }

    const token = await new SignJWT({
      sub: String(user.id),
      email: user.email,
      fullName: user.fullName,
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
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Đã xảy ra lỗi.' }, { status: 500 });
  }
}
