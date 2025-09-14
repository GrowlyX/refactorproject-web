import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { GitHubService } from '@/lib/github/github-service';
import { GitHubSyncService } from '@/lib/github/github-sync';

export async function POST(request: NextRequest) {
  try {
      const { session } = await authkit(request);
      const user = session.user.user
      if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const body = await request.json();
    const { accessToken } = body;

    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 });
    }

    // Initialize GitHub service
    const githubService = new GitHubService(accessToken);

    // Verify the access token by getting user info
    const githubUser = await githubService.getAuthenticatedUser();

    // Get user's organizations
    const organizations = await githubService.getUserOrganizations();

    // Sync organizations with database
    const syncService = new GitHubSyncService(accessToken);
    const syncResult = await syncService.syncUserOrganizations(user.id);

    return NextResponse.json({
      success: true,
      githubUser,
      organizations,
      syncResult,
    });

  } catch (error) {
    console.error('GitHub connect error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to GitHub', details: error.message },
      { status: 500 }
    );
  }
}
