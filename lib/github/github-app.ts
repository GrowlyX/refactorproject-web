/**
 * GitHub App configuration and utilities
 */

import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

export interface GitHubAppConfig {
  appId: string;
  clientId: string;
  clientSecret: string;
  webhookSecret?: string;
  privateKey?: string;
}

export interface GitHubInstallation {
  id: number;
  account: {
    id: number;
    login: string;
    type: 'Organization' | 'User';
  };
  app_id: number;
  app_slug: string;
  created_at: string;
  updated_at: string;
  permissions: Record<string, string>;
  events: string[];
  single_file_name?: string;
  has_multiple_single_files?: boolean;
  single_file_paths?: string[];
  repository_selection: 'all' | 'selected';
  suspended_at?: string;
  suspended_by?: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    gravatar_id: string;
    url: string;
    html_url: string;
    followers_url: string;
    following_url: string;
    gists_url: string;
    starred_url: string;
    subscriptions_url: string;
    organizations_url: string;
    repos_url: string;
    events_url: string;
    received_events_url: string;
    type: string;
    site_admin: boolean;
  };
}

export class GitHubAppService {
  private config: GitHubAppConfig;
  private octokit: Octokit;

  constructor(config: GitHubAppConfig) {
    this.config = config;

    // Validate required fields
    if (!config.appId) {
      throw new Error('GitHub App ID is required');
    }
    if (!config.privateKey) {
      throw new Error('GitHub App private key is required');
    }

    // Format the private key properly
    const formattedPrivateKey = config.privateKey.replace(/\\n/g, '\n');

    this.octokit = new Octokit({
        authStrategy: createAppAuth,
      auth: {
        appId: parseInt(config.appId), clientId: config.clientId,
          clientSecret: config.clientSecret,
        privateKey: formattedPrivateKey,
      },
    });
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
   * Generate OAuth authorization URL for GitHub App
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
   * Generate GitHub App installation URL with OAuth callback
   */
  generateInstallationUrlWithCallback(orgLogin?: string, redirectUri?: string): string {
    const baseUrl = orgLogin
      ? `https://github.com/organizations/${orgLogin}/settings/installations/new`
      : 'https://github.com/apps/project-refactor/installations/new';

    const params = new URLSearchParams({
      app_id: this.config.appId,
      ...(redirectUri && { redirect_uri: redirectUri }),
    });

    return `${baseUrl}?${params.toString()}`;
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

  /**
   * Get all installations for the GitHub App
   */
  async getInstallations(): Promise<GitHubInstallation[]> {
    try {
      const { data } = await this.octokit.apps.listInstallations();
      console.log('Installations data:', data);
      return data;
    } catch (error) {
      console.error('Error fetching installations:', error);
      throw error;
    }
  }

  /**
   * Get installation by ID
   */
  async getInstallation(installationId: number): Promise<GitHubInstallation> {
    const { data } = await this.octokit.apps.getInstallation({
      installation_id: installationId,
    });
    return data;
  }

  /**
   * Get installation access token
   */
  async getInstallationAccessToken(installationId: number): Promise<string> {
    const { data } = await this.octokit.apps.createInstallationAccessToken({
      installation_id: installationId,
    });
    return data.token;
  }

  /**
   * Delete an installation
   */
  async deleteInstallation(installationId: number): Promise<void> {
    await this.octokit.apps.deleteInstallation({
      installation_id: installationId,
    });
  }

  /**
   * Get repositories accessible to an installation
   */
  async getInstallationRepositories(installationId: number) {
    const formattedPrivateKey = (this.config.privateKey || '').replace(/\\n/g, '\n');

    const octokit = new Octokit({
      auth: createAppAuth({
        appId: parseInt(this.config.appId),
        privateKey: formattedPrivateKey,
        installationId: installationId,
      }),
    });

    const { data } = await octokit.apps.listReposAccessibleToInstallation();
    return data.repositories;
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
