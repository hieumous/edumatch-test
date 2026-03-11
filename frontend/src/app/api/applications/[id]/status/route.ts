import { NextRequest, NextResponse } from 'next/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status, feedback } = await request.json();
    const applicationId = params.id;

    // Mock update - in real app, this would update the database
    console.log(`Updating application ${applicationId} to status: ${status}`);
    if (feedback) {
      console.log(`Feedback: ${feedback}`);
    }

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      data: {
        id: applicationId,
        status,
        feedback,
        updatedAt: new Date().toISOString()
      },
      message: `Application status updated to ${status}`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update application status',
        message: 'An error occurred while updating the application'
      },
      { status: 500 }
    );
  }
}