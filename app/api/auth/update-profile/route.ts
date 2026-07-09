import { NextResponse, type NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';

const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Phiên đăng nhập đã hết hạn.' }, { status: 401 });
    }

    const { payload } = await jwtVerify(token, secret);
    const userId = Number(payload.sub);

    const { fullName, oldPassword, newPassword, confirmPassword } = await req.json();

    if (!fullName || fullName.trim() === '') {
      return NextResponse.json({ error: 'Tên hiển thị không được để trống.' }, { status: 400 });
    }

    const updateData: any = {
      fullName: fullName.trim()
    };

    // If changing password, perform validations
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

      // Query current password from database
      const supabase = await createClient();
      const { data: user, error: userError } = await supabase
        .from('User')
        .select('password')
        .eq('id', userId)
        .single();

      if (userError || !user) {
        return NextResponse.json({ error: 'Không thể tìm thấy tài khoản người dùng.' }, { status: 404 });
      }

      const isOldPasswordCorrect = await bcrypt.compare(oldPassword, user.password ?? '');
      if (!isOldPasswordCorrect) {
        return NextResponse.json({ error: 'Mật khẩu cũ không chính xác.' }, { status: 400 });
      }

      // Hash new password securely
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      updateData.password = hashedPassword;
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from('User')
      .update(updateData)
      .eq('id', userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error updating profile:', err);
    return NextResponse.json({ error: 'Đã xảy ra lỗi hệ thống khi cập nhật.' }, { status: 500 });
  }
}
