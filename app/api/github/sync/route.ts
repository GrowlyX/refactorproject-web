import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { GitHubSyncService } from '@/lib/github/github-sync';

export async function POST(request: NextRequest) {
  try {
    const { session } = await authkit(request);
    const user = session
    if (!user.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { accessToken, organizationId } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    const syncService = new GitHubSyncService(accessToken);

    let syncResult;
    if (organizationId) {
      // Sync specific organization
      syncResult = await syncService.syncOrganization(organizationId, accessToken);
    } else {
      // Sync all user organizations
      syncResult = await syncService.syncUserOrganizations(user.user.user.id);
    }

    return NextResponse.json({
      success: syncResult.success,
      syncResult,
    });

  } catch (error) {
    console.error('GitHub sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync GitHub data', details: error.message },
      { status: 500 }
    );
  }
}
