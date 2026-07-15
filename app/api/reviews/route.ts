import { NextResponse, type NextRequest } from 'next/server';

const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';

export async function DELETE(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID đánh giá không được để trống.' }, { status: 400 });
    }

    // Call NestJS backend to delete the review
    const backendRes = await fetch(`${backendUrl}/reviews/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!backendRes.ok) {
      const errorData = await backendRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.message || 'Không thể xóa đánh giá.' },
        { status: backendRes.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting review through backend:', err);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống khi xóa.' }, { status: 500 });
  }
}
