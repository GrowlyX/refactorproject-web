import { NextRequest, NextResponse } from 'next/server';
import { getSyncScheduler, startSyncScheduler, stopSyncScheduler } from '@/lib/sync/scheduler';

export async function GET() {
  try {
    const scheduler = getSyncScheduler();
    const status = scheduler.getStatus();

    return NextResponse.json({
      success: true,
      status,
    });
  } catch (error) {
    console.error('Error getting scheduler status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get scheduler status', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, intervalMinutes } = body;

    if (action === 'start') {
      startSyncScheduler(intervalMinutes || 60);
      return NextResponse.json({
        success: true,
        message: `Sync scheduler started with ${intervalMinutes || 60} minute intervals`,
      });
    } else if (action === 'stop') {
      stopSyncScheduler();
      return NextResponse.json({
        success: true,
        message: 'Sync scheduler stopped',
      });
    } else {
      return NextResponse.json(
        { error: 'Invalid action. Use "start" or "stop"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error managing scheduler:', error);
    return NextResponse.json(
      { 
        error: 'Failed to manage scheduler', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
