import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { GitHubSyncService } from '@/lib/github/github-sync';

export async function POST(request: NextRequest) {
  try {
      const { session } = await authkit(request);
      const user = session.user
      if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Sync all installations
    const syncResult = await syncService.syncInstallations(user.id);

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
