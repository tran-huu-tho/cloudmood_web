import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

import { createClient } from '@/lib/supabase/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ user: null });

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub;

    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('User')
      .select('id, email, fullName, avatar, role, createdAt')
      .eq('id', Number(userId))
      .single();

    if (error || !user) {
      return NextResponse.json({
        user: { 
          id: userId,
          email: payload.email, 
          fullName: payload.fullName, 
          avatar: payload.avatar,
          createdAt: null
        },
      });
    }

    return NextResponse.json({
      user: { 
        id: user.id,
        email: user.email, 
        fullName: user.fullName, 
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt
      },
    });
  } catch {
    return NextResponse.json({ user: null });
  }
}
