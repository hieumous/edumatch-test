import { NextRequest, NextResponse } from 'next/server';

// Mock API endpoint to check if user has applied for a scholarship

const mockApplications = new Map();

export async function GET(
  request: NextRequest,
  { params }: { params: { scholarshipId: string } }
) {
  try {
    const { scholarshipId } = params;

    // Simulate authentication check
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock user ID from token
    const userId = 'mock-user-id';

    // Check if user has applied for this scholarship
    const application = Array.from(mockApplications.values()).find(
      (app: any) => app.applicantId === userId && app.scholarshipId === scholarshipId
    );

    return NextResponse.json({
      success: true,
      data: application || null,
      hasApplied: !!application,
    });
  } catch (error) {
    console.error('Error checking application status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}