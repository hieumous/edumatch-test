import { NextRequest, NextResponse } from 'next/server';

// URL của Java Backend
// For server-side (Next.js API routes), use Docker container name
// For client-side, use NEXT_PUBLIC_API_GATEWAY (localhost:8080)
const JAVA_API_URL = process.env.API_GATEWAY 
  || 'http://api-gateway-test:80'; // Container name for server-side Docker networking

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return NextResponse.json({ message: 'Unauthorized - No token provided' }, { status: 401 });
    }

    const token = authHeader.startsWith('Bearer ') ? authHeader : `Bearer ${authHeader}`;
    const backendUrl = `${JAVA_API_URL}/api/bookmarks/my`;

    const res = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      return NextResponse.json(
        { 
          message: `Backend error: ${res.status}`,
          details: errorText 
        }, 
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('[Bookmarks My] Error:', error);
    return NextResponse.json(
      { 
        message: 'Internal Server Error',
        error: error.message || 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}