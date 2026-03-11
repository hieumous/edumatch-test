import { NextRequest, NextResponse } from 'next/server';

// Mock saved scholarships storage
const mockSavedScholarships = new Map();

export async function DELETE(
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

    // Find and remove saved scholarship
    const savedToRemove = Array.from(mockSavedScholarships.entries()).find(
      ([id, saved]: [string, any]) => saved.userId === userId && saved.scholarshipId === scholarshipId
    );

    if (!savedToRemove) {
      return NextResponse.json(
        { error: 'Saved scholarship not found' },
        { status: 404 }
      );
    }

    mockSavedScholarships.delete(savedToRemove[0]);

    return NextResponse.json({
      success: true,
      message: 'Scholarship unsaved successfully',
    });
  } catch (error) {
    console.error('Error unsaving scholarship:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}