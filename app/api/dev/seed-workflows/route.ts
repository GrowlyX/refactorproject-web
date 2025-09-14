import { NextResponse } from 'next/server';
import { seedWorkflows } from '@/lib/db/seed-workflows';

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
    }

    await seedWorkflows();

    return NextResponse.json({
      success: true,
      message: 'Sample workflows seeded successfully',
    });

  } catch (error) {
    console.error('Seed workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to seed workflows', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
