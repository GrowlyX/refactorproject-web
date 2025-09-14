import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { createWorkflow } from '@/lib/db/queries';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session } = await authkit(request);
    const user = session.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const projectId = parseInt(id);
    if (isNaN(projectId)) {
      return NextResponse.json({ error: 'Invalid project ID' }, { status: 400 });
    }

    // Create a new workflow with 'scheduling' state
    const workflow = await createWorkflow(projectId, 'scheduling', undefined, session);

    if (!workflow) {
      return NextResponse.json({ error: 'Failed to create workflow' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      workflow,
    });

  } catch (error) {
    console.error('Trigger workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to trigger workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
