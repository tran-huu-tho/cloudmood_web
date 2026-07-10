import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);
const backendUrl = process.env.BACKEND_API_URL || 'http://localhost:3000';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const backendToken = payload.backendToken as string;

    if (!backendToken) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin xác thực backend.' }, { status: 401 });
    }

    const { fullName, oldPassword, newPassword, confirmPassword } = await req.json();

    if (!fullName || fullName.trim() === '') {
      return NextResponse.json({ error: 'Tên hiển thị không được để trống.' }, { status: 400 });
    }

    // 1. Call NestJS backend to update profile name
    const profileRes = await fetch(`${backendUrl}/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${backendToken}`,
      },
      body: JSON.stringify({
        fullName: fullName.trim(),
      }),
    });

    const profileData = await profileRes.json();
    if (!profileRes.ok) {
      return NextResponse.json(
        { error: profileData.message || 'Không thể cập nhật thông tin cá nhân.' },
        { status: profileRes.status }
      );
    }

    // 2. Call NestJS backend to change password if input is provided
    const hasPasswordInput = oldPassword || newPassword || confirmPassword;
    if (hasPasswordInput) {
      if (!oldPassword || !newPassword || !confirmPassword) {
        return NextResponse.json({ 
          error: 'Vui lòng điền đầy đủ: Mật khẩu cũ, Mật khẩu mới và Xác nhận mật khẩu mới.' 
        }, { status: 400 });
      }

      if (newPassword !== confirmPassword) {
        return NextResponse.json({ error: 'Xác nhận mật khẩu mới không khớp.' }, { status: 400 });
      }

      if (newPassword.length < 6) {
        return NextResponse.json({ error: 'Mật khẩu mới phải có ít nhất 6 ký tự.' }, { status: 400 });
      }

      const passwordRes = await fetch(`${backendUrl}/auth/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${backendToken}`,
        },
        body: JSON.stringify({
          currentPassword: oldPassword,
          newPassword: newPassword,
        }),
      });

      const passwordData = await passwordRes.json();
      if (!passwordRes.ok) {
        return NextResponse.json(
          { error: passwordData.message || 'Mật khẩu cũ không chính xác hoặc không hợp lệ.' },
          { status: passwordRes.status }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating profile through backend:', err);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống khi cập nhật.' }, { status: 500 });
  }
}
