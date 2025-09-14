/**
 * GitHub App configuration and utilities
 */

export interface GitHubAppConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string;
  privateKey?: string;
}

export class GitHubAppService {
  private config: GitHubAppConfig;

  constructor(config: GitHubAppConfig) {
    this.config = config;
  }

  /**
   * Generate GitHub App installation URL for an organization
   */
  generateInstallationUrl(orgLogin: string): string {
    return `https://github.com/organizations/${orgLogin}/settings/installations/new?app_id=${this.config.appId}`;
  }

  /**
   * Generate GitHub App installation URL for a user
   */
  generateUserInstallationUrl(): string {
    return `https://github.com/settings/installations/new?app_id=${this.config.appId}`;
  }

  /**
   * Generate OAuth authorization URL
   */
  generateOAuthUrl(redirectUri: string, state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: redirectUri,
      scope: 'read:org,read:user,repo',
      ...(state && { state }),
    });

    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange OAuth code for access token
   */
  async exchangeCodeForToken(code: string, redirectUri: string): Promise<string> {
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(`OAuth error: ${data.error_description || data.error}`);
    }

    return data.access_token;
  }
}

/**
 * Default GitHub App configuration
 * In production, these should come from environment variables
 */
export const defaultGitHubAppConfig: GitHubAppConfig = {
  appId: process.env.GITHUB_APP_ID || '',
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
  privateKey: process.env.GITHUB_PRIVATE_KEY || '',
};
