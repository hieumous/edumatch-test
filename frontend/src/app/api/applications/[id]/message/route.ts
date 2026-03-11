import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json();
    const applicationId = params.id;

    // Mock send message - in real app, this would send notification/email
    console.log(`Sending message to applicant for application ${applicationId}: ${message}`);

    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 300));

    return NextResponse.json({
      success: true,
      data: {
        applicationId,
        message,
        sentAt: new Date().toISOString()
      },
      message: 'Message sent successfully'
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