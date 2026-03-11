import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { message } = await request.json();
    const applicationId = params.id;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Message content is required',
          message: 'Please provide a message to send'
        },
        { status: 400 }
      );
    }

    // Mock sending message - in real app, this would send an email/notification
    console.log(`Sending message to applicant for application ${applicationId}`);
    console.log(`Message content: ${message}`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully to applicant',
      data: {
        applicationId,
        messageContent: message,
        sentAt: new Date().toISOString()
      }
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