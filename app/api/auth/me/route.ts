import { NextResponse, type NextRequest } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';

export async function GET(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  if (!token) return NextResponse.json({ user: null });

  try {
    const backendRes = await fetch(`${backendUrl}/auth/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!backendRes.ok) {
      const response = NextResponse.json({ user: null });
      if (backendRes.status === 401) {
        response.cookies.delete('admin_session');
      }
      return response;
    }

    const data = await backendRes.json();
    return NextResponse.json({
      user: data.user,
    });
  } catch (err) {
    console.error('Error fetching user profile from backend:', err);
    return NextResponse.json({ user: null });
  }
}
