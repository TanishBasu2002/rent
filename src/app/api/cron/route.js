// File: /app/api/cron/route.js
import { NextResponse } from 'next/server';

export const runtime = "edge"

export async function GET() {
  try {
    // Get the base URL dynamically
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://rent-tar.vercel.app';
    
    // Make a request to your notifications endpoint
    const response = await fetch(`${baseUrl}/api/cron/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.CRON_SECRET_KEY}`
      }
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}