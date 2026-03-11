import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body;

    // Validate input
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { message: 'Vui lòng điền đầy đủ thông tin' },
        { status: 400 }
      );
    }

    // Create new user (in production, save to database and hash password)
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      firstName,
      lastName,
      role: role || UserRole.USER,
      avatar: null,
      phone: null,
      location: null,
      bio: null,
      verified: false,
      subscriptionType: 'FREE' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Generate token
    const token = `mock_token_${newUser.id}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      data: {
        token,
        user: newUser,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi khi đăng ký' },
      { status: 500 }
    );
  }
}
