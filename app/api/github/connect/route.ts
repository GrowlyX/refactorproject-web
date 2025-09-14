import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { GitHubAppService } from '@/lib/github/github-app';
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
    const clientId = process.env.GITHUB_CLIENT_ID;
    const clientSecret = process.env.GITHUB_CLIENT_SECRET;

    // Validate required environment variables
    if (!appId) {
      return NextResponse.json({ error: 'GITHUB_APP_ID environment variable is missing' }, { status: 500 });
    }
    if (!privateKey) {
      return NextResponse.json({ error: 'GITHUB_PRIVATE_KEY environment variable is missing' }, { status: 500 });
    }
    if (!clientId) {
      return NextResponse.json({ error: 'GITHUB_CLIENT_ID environment variable is missing' }, { status: 500 });
    }
    if (!clientSecret) {
      return NextResponse.json({ error: 'GITHUB_CLIENT_SECRET environment variable is missing' }, { status: 500 });
    }

    // Initialize GitHub App service
    const githubAppService = new GitHubAppService({
      appId,
      privateKey,
      clientId,
      clientSecret,
    });

    // Get all installations
    const installations = await githubAppService.getInstallations();

    // Sync installations with database
    const syncService = new GitHubSyncService(appId, privateKey);
    const syncResult = await syncService.syncInstallations(user.id);

    return NextResponse.json({
      success: true,
      installations,
      syncResult,
    });

  } catch (error) {
    console.error('GitHub connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to GitHub', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
