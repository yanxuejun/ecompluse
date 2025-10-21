import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Temporary backup version that works without database
// GET /api/favorites - Fetch user's favorite products
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Return empty array for now - will be replaced when database is ready
    return NextResponse.json({
      success: true,
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      message: 'Database not yet configured - returning empty results'
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a product to favorites
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // For now, just return success without actually saving
    return NextResponse.json({
      success: true,
      message: 'Database not yet configured - favorite not saved',
      data: {
        id: Date.now(), // temporary ID
        ...body,
        userid: userId,
      }
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}
