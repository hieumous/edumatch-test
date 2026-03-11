import { NextRequest, NextResponse } from 'next/server';

// Mock API endpoint for applications
// This provides a backend-like interface for testing

const mockApplications = new Map();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scholarshipId = searchParams.get('scholarshipId');
    const status = searchParams.get('status');

    // Simulate authentication check
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock user ID from token
    const userId = 'mock-user-id';

    let applications = Array.from(mockApplications.values()).filter(
      (app: any) => app.applicantId === userId
    );

    if (scholarshipId) {
      applications = applications.filter((app: any) => app.scholarshipId === scholarshipId);
    }

    if (status) {
      applications = applications.filter((app: any) => app.status === status);
    }

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scholarshipId, coverLetter, motivation, additionalInfo, portfolioUrl, linkedinUrl, githubUrl } = body;

    // Simulate authentication check
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock user ID from token
    const userId = 'mock-user-id';

    // Check if user already applied
    const existingApplication = Array.from(mockApplications.values()).find(
      (app: any) => app.applicantId === userId && app.scholarshipId === scholarshipId
    );

    if (existingApplication) {
      return NextResponse.json(
        { error: 'You have already applied for this scholarship' },
        { status: 400 }
      );
    }

    // Create new application
    const applicationId = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newApplication = {
      id: applicationId,
      applicantId: userId,
      scholarshipId,
      status: 'SUBMITTED',
      coverLetter,
      motivation,
      additionalInfo,
      portfolioUrl,
      linkedinUrl,
      githubUrl,
      submittedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockApplications.set(applicationId, newApplication);

    return NextResponse.json({
      success: true,
      data: newApplication,
      message: 'Application submitted successfully',
    });
  } catch (error) {
    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}