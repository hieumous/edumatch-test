import { NextRequest, NextResponse } from 'next/server';

// Mock saved scholarships storage
const mockSavedScholarships = new Map();

export async function GET(request: NextRequest) {
  try {
    // Simulate authentication check
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock user ID from token
    const userId = 'mock-user-id';

    const savedScholarships = Array.from(mockSavedScholarships.values()).filter(
      (saved: any) => saved.userId === userId
    );

    return NextResponse.json({
      success: true,
      data: savedScholarships,
    });
  } catch (error) {
    console.error('Error fetching saved scholarships:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scholarshipId } = body;

    // Simulate authentication check
    const token = request.headers.get('authorization');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Mock user ID from token
    const userId = 'mock-user-id';

    // Check if already saved
    const existingSaved = Array.from(mockSavedScholarships.values()).find(
      (saved: any) => saved.userId === userId && saved.scholarshipId === scholarshipId
    );

    if (existingSaved) {
      return NextResponse.json(
        { error: 'Scholarship already saved' },
        { status: 400 }
      );
    }

    // Create new saved scholarship
    const savedId = `saved-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newSaved = {
      id: savedId,
      userId,
      scholarshipId,
      createdAt: new Date().toISOString(),
    };

    mockSavedScholarships.set(savedId, newSaved);

    return NextResponse.json({
      success: true,
      data: newSaved,
      message: 'Scholarship saved successfully',
    });
  } catch (error) {
    console.error('Error saving scholarship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}