import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { getOrganizationProjects } from '@/lib/db/queries';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session } = await authkit(request);
    const user = session.user;
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = parseInt(params.id);
    if (isNaN(organizationId)) {
      return NextResponse.json({ error: 'Invalid organization ID' }, { status: 400 });
    }

    const projects = await getOrganizationProjects(organizationId, session);

    return NextResponse.json({
      success: true,
      projects,
    });

  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
