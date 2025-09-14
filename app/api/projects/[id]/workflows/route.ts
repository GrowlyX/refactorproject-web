import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { getProjectWorkflows, createWorkflow } from '@/lib/db/queries';

export async function GET(
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

    const workflows = await getProjectWorkflows(projectId, session);

    return NextResponse.json({
      success: true,
      workflows,
    });

  } catch (error) {
    console.error('Get workflows error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch workflows', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { state = 'scheduling', results } = body;

    const workflow = await createWorkflow(projectId, state, results, session);

    if (!workflow) {
      return NextResponse.json({ error: 'Failed to create workflow' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      workflow,
    });

  } catch (error) {
    console.error('Create workflow error:', error);
    return NextResponse.json(
      { error: 'Failed to create workflow', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
