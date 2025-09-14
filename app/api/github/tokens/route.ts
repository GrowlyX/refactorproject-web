import { NextRequest, NextResponse } from 'next/server';
import { GitHubAppService, defaultGitHubAppConfig } from '@/lib/github/github-app';
import { db } from '@/lib/db/drizzle';
import { organizations, projects } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

interface TokenRequest {
  repositoryId?: number;
  organizationName?: string;
  repositoryName?: string;
  internalApiKey: string;
}

interface TokenResponse {
  githubAppToken: string;
  installationToken: string;
  repositoryUrl: string;
  repositoryName: string;
  organizationName: string;
  expiresAt: string;
}

/**
 * POST /api/github/tokens
 * INTERNAL API ONLY - Generate GitHub App token and installation token for repository access
 *
 * Body (either repositoryId OR organizationName + repositoryName):
 * {
 *   "repositoryId": number,                    // Option 1: Use repository ID
 *   "organizationName": string,                 // Option 2: Search by org name
 *   "repositoryName": string,                   // Option 2: Search by repo name
 *   "internalApiKey": string
 * }
 *
 * Returns:
 * {
 *   "githubAppToken": string,
 *   "installationToken": string,
 *   "repositoryUrl": string,
 *   "repositoryName": string,
 *   "organizationName": string,
 *   "expiresAt": string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body: TokenRequest = await request.json();
    const { repositoryId, organizationName, repositoryName, internalApiKey } = body;

    // Validate required fields
    if (!internalApiKey) {
      return NextResponse.json(
        { error: 'internalApiKey is required' },
        { status: 400 }
      );
    }

    // Validate that either repositoryId OR (organizationName + repositoryName) is provided
    if (!repositoryId && (!organizationName || !repositoryName)) {
      return NextResponse.json(
        { error: 'Either repositoryId OR both organizationName and repositoryName are required' },
        { status: 400 }
      );
    }

    // Validate internal API key (static key for internal use only)
    const expectedApiKey = process.env.INTERNAL_API_KEY;
    if (!expectedApiKey || internalApiKey !== expectedApiKey) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Build query based on search method
    let query = db
      .select({
        repository: projects,
        organization: organizations,
      })
      .from(projects)
      .innerJoin(organizations, eq(projects.organizationId, organizations.id));

    if (repositoryId) {
      // Search by repository ID
      query = query.where(eq(projects.id, repositoryId));
    } else {
      // Search by organization name and repository name
      query = query.where(
        and(
          eq(organizations.name, organizationName!),
          eq(projects.repositoryName, repositoryName!)
        )
      );
    }

    const repositoryData = await query.limit(1);

    if (repositoryData.length === 0) {
      const searchMethod = repositoryId ? `ID ${repositoryId}` : `${organizationName}/${repositoryName}`;
      return NextResponse.json(
        { error: `Repository not found: ${searchMethod}` },
        { status: 404 }
      );
    }

    const { repository, organization } = repositoryData[0];

    // Check if GitHub App is installed for this organization
    if (!organization.githubAppInstalled) {
      return NextResponse.json(
        { error: `GitHub App is not installed for organization: ${organization.name}` },
        { status: 400 }
      );
    }

    // Initialize GitHub App service
    const githubAppService = new GitHubAppService(defaultGitHubAppConfig);

    // Get installations to find the one for this organization
    const installations = await githubAppService.getInstallations();
    const installation = installations.find(
      (inst) => inst.account.id === organization.githubId
    );

    if (!installation) {
      return NextResponse.json(
        { error: `GitHub App installation not found for organization: ${organization.name}` },
        { status: 404 }
      );
    }

    // Generate installation access token
    const installationToken = await githubAppService.getInstallationAccessToken(
      installation.id
    );

    // Prepare response
    const response: TokenResponse = {
      githubAppToken: process.env.GITHUB_ACCESS_TOKEN || '', // This is the token for GitHub API calls
      installationToken, // Same token, but explicitly named for clarity
      repositoryUrl: repository.repositoryUrl || `https://github.com/${organization.name}/${repository.repositoryName}`,
      repositoryName: repository.repositoryName,
      organizationName: organization.name,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error generating installation token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
