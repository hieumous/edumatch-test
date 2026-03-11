import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Clear auth token from cookies
    const response = NextResponse.json({
      success: true,
      data: { message: 'Đăng xuất thành công' },
    });

    // Clear cookies
    response.cookies.delete('auth_token');
    response.cookies.delete('auth_user');

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi khi đăng xuất' },
      { status: 500 }
    );
  }
}
