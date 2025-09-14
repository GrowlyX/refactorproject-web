import { NextRequest, NextResponse } from 'next/server';
import { GitHubSyncService } from '@/lib/github/github-sync';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const organizationId = parseInt(params.id);
    if (isNaN(organizationId)) {
      return NextResponse.json(
        { error: 'Invalid organization ID' },
        { status: 400 }
      );
    }

    const githubSyncService = new GitHubSyncService(appId, privateKey);

    // Run background sync for organization members only
    const result = await githubSyncService.backgroundSyncMembers(organizationId);

    return NextResponse.json({
      success: result.success,
      message: `Members sync completed for organization ${organizationId}`,
      results: {
        organizationsSynced: result.organizationsSynced,
        repositoriesSynced: result.repositoriesSynced,
        membersSynced: result.membersSynced,
        errors: result.errors,
      },
    });

  } catch (error) {
    console.error('Members background sync error:', error);
    return NextResponse.json(
      { 
        error: 'Members background sync failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
