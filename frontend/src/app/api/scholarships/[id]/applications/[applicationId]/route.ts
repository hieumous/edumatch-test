import { NextRequest, NextResponse } from 'next/server';

// Mock message storage (in a real app, this would be in a database)
let messages: any[] = [];

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; applicationId: string } }
) {
  try {
    const scholarshipId = params.id;
    const applicationId = params.applicationId;
    const body = await request.json();
    const { status } = body;

    // Validate status
    const validStatuses = ['SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid status',
          message: 'Status must be one of: SUBMITTED, UNDER_REVIEW, ACCEPTED, REJECTED'
        },
        { status: 400 }
      );
    }

    // In a real app, you would update the database here
    // For mock purposes, we'll just return success
    
    return NextResponse.json({
      success: true,
      data: {
        id: applicationId,
        scholarshipId,
        status,
        updatedAt: new Date().toISOString()
      },
      message: `Application status updated to ${status} successfully`
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to update application status',
        message: 'An error occurred while updating the application status'
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; applicationId: string } }
) {
  try {
    const scholarshipId = params.id;
    const applicationId = params.applicationId;
    const body = await request.json();
    const { message, subject } = body;

    if (!message || !subject) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields',
          message: 'Subject and message are required'
        },
        { status: 400 }
      );
    }

    // Create a new message (in a real app, this would be saved to database)
    const newMessage = {
      id: Date.now().toString(),
      scholarshipId,
      applicationId,
      subject,
      message,
      sentAt: new Date().toISOString(),
      from: 'provider', // Assuming the provider is sending the message
      to: 'applicant'
    };

    messages.push(newMessage);

    return NextResponse.json({
      success: true,
      data: newMessage,
      message: 'Message sent successfully to applicant'
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send message',
        message: 'An error occurred while sending the message'
      },
      { status: 500 }
    );
  }
}