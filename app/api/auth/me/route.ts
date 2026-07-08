import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ user: null });

  try {
    const { payload } = await jwtVerify(token, secret);
    return NextResponse.json({
      user: { email: payload.email, fullName: payload.fullName },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
