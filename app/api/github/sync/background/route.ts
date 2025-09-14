import { NextResponse } from 'next/server';
import { GitHubSyncService } from '@/lib/github/github-sync';

export async function POST() {
  try {
    // Validate environment variables
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;

    if (!appId || !privateKey) {
      return NextResponse.json(
        { error: 'GitHub App configuration missing' },
        { status: 500 }
      );
    }

    const githubSyncService = new GitHubSyncService(appId, privateKey);

    // Run background sync for all organizations
    const result = await githubSyncService.backgroundSyncAll();

    return NextResponse.json({
      success: result.success,
      message: 'Background sync completed',
      results: {
        organizationsSynced: result.organizationsSynced,
        repositoriesSynced: result.repositoriesSynced,
        membersSynced: result.membersSynced,
        errors: result.errors,
      },
    });

  } catch (error) {
    console.error('Background sync error:', error);
    return NextResponse.json(
      { 
        error: 'Background sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
