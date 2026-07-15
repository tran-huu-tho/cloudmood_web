import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(req, await params);
}

async function handleProxy(req: NextRequest, resolvedParams: { path: string[] }) {
  const token = req.cookies.get('admin_session')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
  }

  // Construct backend URL path
  const subPath = resolvedParams.path.join('/');
  const searchParams = req.nextUrl.search;
  const url = `${backendUrl}/admin/${subPath}${searchParams}`;

  try {
    const headers = new Headers();
    headers.set('Authorization', `Bearer ${token}`);
    
    // Forward Content-Type if present and it's a writing method
    const contentType = req.headers.get('content-type');
    if (contentType) {
      headers.set('content-type', contentType);
    }

    const options: RequestInit = {
      method: req.method,
      headers,
    };

    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      const bodyText = await req.text();
      if (bodyText) {
        options.body = bodyText;
      }
    }

    const backendRes = await fetch(url, options);

    if (backendRes.status === 401) {
      const response = NextResponse.json(
        { error: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.' },
        { status: 401 }
      );
      response.cookies.delete('admin_session');
      return response;
    }

    // Direct streaming/pass-through of response headers and body (avoids JSON parse/stringify overhead)
    const resHeaders = new Headers();
    const resContentType = backendRes.headers.get('content-type');
    if (resContentType) {
      resHeaders.set('content-type', resContentType);
    }

    return new NextResponse(backendRes.body, {
      status: backendRes.status,
      headers: resHeaders,
    });
  } catch (err) {
    console.error(`Error proxying admin request to ${url}:`, err);
    return NextResponse.json({ error: 'Lỗi kết nối với máy chủ backend.' }, { status: 500 });
  }
}
