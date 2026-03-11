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

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Extract user ID from token (in production, verify JWT)
    const tokenParts = token.split('_');
    const userId = tokenParts.length > 2 ? tokenParts[2] : null;
    
    if (!userId) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      );
    }
    
    // Find user
    const user = MOCK_USERS.find((u) => u.id === userId || u.userId === userId);

    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { message: 'Đã xảy ra lỗi' },
      { status: 500 }
    );
  }
}
