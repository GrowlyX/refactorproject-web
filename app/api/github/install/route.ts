import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { GitHubAppService } from '@/lib/github/github-app';

export async function GET(request: NextRequest) {
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

    // Generate callback URL
    const callbackUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/github/callback`;

    // Get installation URL with callback for organizations
    const installationUrl = githubAppService.generateInstallationUrlWithCallback('', callbackUrl);

    return NextResponse.json({
      success: true,
      installationUrl,
      callbackUrl,
      appId,
    });

  } catch (error) {
    console.error('GitHub install error:', error);
    return NextResponse.json(
      { error: 'Failed to get installation URL', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
