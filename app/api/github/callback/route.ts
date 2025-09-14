import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { GitHubAppService } from '@/lib/github/github-app';
import { GitHubSyncService } from '@/lib/github/github-sync';

export async function GET(request: NextRequest) {
  try {
    const { session } = await authkit(request);
    const user = session.user;
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const installationId = searchParams.get('installation_id');

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 });
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

    // Exchange code for access token
    const accessToken = await githubAppService.exchangeCodeForToken(
      code,
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/github/callback`
    );

    // If installation_id is provided, sync that specific installation
    if (installationId) {
      const syncService = new GitHubSyncService(appId, privateKey);
      
      // Get installation details
      const installation = await githubAppService.getInstallation(parseInt(installationId));
      
      // Sync the specific installation
      const syncResult = await syncService.syncInstallation(parseInt(installationId), user.id);
      
      return NextResponse.json({
        success: true,
        installation,
        syncResult,
        message: 'Installation synced successfully',
      });
    }

    // If no installation_id, redirect to dashboard with success message
    return NextResponse.redirect(
      new URL('/dashboard?github_connected=true', request.url)
    );

  } catch (error) {
    console.error('GitHub OAuth callback error:', error);
    
    // Redirect to dashboard with error message
    return NextResponse.redirect(
      new URL('/dashboard?github_error=true', request.url)
    );
  }
}
