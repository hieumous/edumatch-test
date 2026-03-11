import { NextRequest, NextResponse } from 'next/server';

// Mock users data for server-side
const MOCK_USERS = [
  {
    id: 'profile-admin-1',
    userId: 'admin-1',
    email: 'admin@edumatch.com',
    role: 'ADMIN',
    firstName: 'System',
    lastName: 'Admin',
    avatar: null,
    bio: 'System Administrator',
    verified: true,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2025-01-01'),
  },
  {
    id: 'profile-student-1',
    userId: 'student-1',
    email: 'john.doe@student.edu',
    role: 'USER',
    firstName: 'John',
    lastName: 'Doe',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=John',
    bio: 'Computer Science student passionate about AI',
    gpa: 3.8,
    skills: ['Python', 'React', 'TensorFlow'],
    verified: true,
    interests: ['Artificial Intelligence', 'Web Development'],
    languages: ['English', 'Spanish'],
    createdAt: new Date('2024-09-01'),
    updatedAt: new Date('2025-01-12'),
  },
  {
    id: 'profile-provider-1',
    userId: 'provider-1',
    email: 'mit@scholarships.edu',
    role: 'EMPLOYER',
    firstName: 'MIT',
    lastName: 'Research Lab',
    avatar: null,
    bio: 'Leading research institution',
    verified: true,
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2025-01-10'),
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { message: 'Email và mật khẩu là bắt buộc' },
        { status: 400 }
      );
    }

    // Find user by email (case-insensitive)
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (!user) {
      return NextResponse.json(
        { message: 'Email hoặc mật khẩu không đúng' },
        { status: 401 }
      );
    }

    // For demo purposes, accept any password
    // In production, you would verify the password hash
    
    // Generate a simple token (in production, use JWT)
    const token = `mock_token_${user.id}_${Date.now()}`;

    // Return user profile and token
    return NextResponse.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          userId: user.userId,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          avatar: user.avatar,
          bio: user.bio,
          verified: user.verified,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
          gpa: user.gpa,
          skills: user.skills,
          interests: user.interests,
          languages: user.languages,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi khi đăng nhập' },
      { status: 500 }
    );
  }
}
