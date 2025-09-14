import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { GitHubSyncService } from '@/lib/github/github-sync';

export async function POST(
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

    // Get GitHub App configuration from environment variables
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;

    // Validate required environment variables
    if (!appId) {
      return NextResponse.json({ error: 'GITHUB_APP_ID environment variable is missing' }, { status: 500 });
    }
    if (!privateKey) {
      return NextResponse.json({ error: 'GITHUB_PRIVATE_KEY environment variable is missing' }, { status: 500 });
    }

    const syncService = new GitHubSyncService(appId, privateKey);

    // Sync repositories for the specific organization
    const syncResult = await syncService.backgroundSyncOrganization(organizationId);

    return NextResponse.json({
      success: syncResult.success,
      repositoriesSynced: syncResult.repositoriesSynced,
      errors: syncResult.errors,
    });

  } catch (error) {
    console.error('GitHub repositories sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync repositories', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
