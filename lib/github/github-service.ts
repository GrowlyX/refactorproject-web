import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';

export interface GitHubUser {
  id: number;
  login: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

export interface GitHubOrganization {
  id: number;
  login: string;
  name?: string;
  description?: string;
  avatar_url?: string;
  html_url: string;
  public_repos: number;
  public_members_count: number;
  created_at: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description?: string;
  html_url: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
  created_at: string;
  updated_at: string;
  language?: string;
  stargazers_count: number;
  forks_count: number;
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
}

export class GitHubService {
  private octokit: Octokit;
  private appId: string;
  private privateKey: string;

  constructor(appId: string, privateKey: string, installationId?: number) {
    this.appId = appId;
    this.privateKey = privateKey;

    // Validate required fields
    if (!appId) {
      throw new Error('GitHub App ID is required');
    }
    if (!privateKey) {
      throw new Error('GitHub App private key is required');
    }

    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    this.octokit = new Octokit({
      auth: createAppAuth({
        appId: parseInt(appId),
        privateKey: formattedPrivateKey,
        installationId: installationId,
      }),
    });
  }

  /**
   * Create a new instance for a specific installation
   */
  static forInstallation(appId: string, privateKey: string, installationId: number): GitHubService {
    return new GitHubService(appId, privateKey, installationId);
  }

  /**
   * Get the authenticated user's information
   */
  async getAuthenticatedUser(): Promise<GitHubUser> {
    const { data } = await this.octokit.users.getAuthenticated();
    return {
      id: data.id,
      login: data.login,
      email: data.email,
      name: data.name,
      avatar_url: data.avatar_url,
    };
  }

  /**
   * Get organizations that the authenticated user is a member of
   */
  async getUserOrganizations(): Promise<GitHubOrganization[]> {
    const { data } = await this.octokit.orgs.listForAuthenticatedUser({
      per_page: 100,
    });

    return data.map(org => ({
      id: org.id,
      login: org.login,
      name: org.name,
      description: org.description,
      avatar_url: org.avatar_url,
      html_url: org.html_url,
      public_repos: org.public_repos,
      public_members_count: org.public_members_count,
      created_at: org.created_at,
    }));
  }

  /**
   * Get repositories for a specific organization
   */
  async getOrganizationRepositories(orgLogin: string): Promise<GitHubRepository[]> {
    const { data } = await this.octokit.repos.listForOrg({
      org: orgLogin,
      per_page: 100,
      sort: 'updated',
    });

    return data.map(repo => ({
      id: repo.id,
      name: repo.name,
      full_name: repo.full_name,
      description: repo.description,
      html_url: repo.html_url,
      clone_url: repo.clone_url,
      default_branch: repo.default_branch,
      private: repo.private,
      created_at: repo.created_at,
      updated_at: repo.updated_at,
      language: repo.language,
      stargazers_count: repo.stargazers_count,
      forks_count: repo.forks_count,
    }));
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(orgLogin: string): Promise<GitHubUser[]> {
    const { data } = await this.octokit.orgs.listMembers({
      org: orgLogin,
      per_page: 100,
    });

    return data.map(member => ({
      id: member.id,
      login: member.login,
      avatar_url: member.avatar_url,
    }));
  }

  /**
   * Check if the GitHub App is installed on an organization
   */
  async getAppInstallations(): Promise<GitHubInstallation[]> {
    const { data } = await this.octokit.apps.listInstallationsForAuthenticatedUser();

    return data.installations.map(installation => ({
      id: installation.id,
      account: {
        id: installation.account.id,
        login: installation.account.login,
        type: installation.account.type as 'Organization' | 'User',
      },
      app_id: installation.app_id,
      app_slug: installation.app_slug,
      created_at: installation.created_at,
      updated_at: installation.updated_at,
    }));
  }

  /**
   * Get installation access token for a specific installation
   */
  async getInstallationAccessToken(installationId: number): Promise<string> {
    const { data } = await this.octokit.apps.createInstallationAccessToken({
      installation_id: installationId,
    });
    return data.token;
  }

  /**
   * Create a GitHub App installation URL for an organization
   */
  createInstallationUrl(orgLogin: string, appId: string): string {
    return `https://github.com/organizations/${orgLogin}/settings/installations/new?app_id=${appId}`;
  }

  /**
   * Get repository content for analysis
   */
  async getRepositoryContent(owner: string, repo: string, path: string = '') {
    try {
      const { data } = await this.octokit.repos.getContent({
        owner,
        repo,
        path,
      });
      return data;
    } catch (error) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get repository languages
   */
  async getRepositoryLanguages(owner: string, repo: string) {
    const { data } = await this.octokit.repos.listLanguages({
      owner,
      repo,
    });
    return data;
  }

  /**
   * Get repository branches
   */
  async getRepositoryBranches(owner: string, repo: string) {
    const { data } = await this.octokit.repos.listBranches({
      owner,
      repo,
      per_page: 100,
    });
    return data;
  }
}
