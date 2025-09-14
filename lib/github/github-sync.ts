import { db } from '../db/drizzle';
import { organizations, organizationMembers, projects, users, githubSyncLogs } from '../db/schema';
import { GitHubService, GitHubOrganization, GitHubRepository, GitHubUser } from './github-service';
import { eq, and } from 'drizzle-orm';

export interface SyncResult {
  success: boolean;
  organizationsSynced: number;
  repositoriesSynced: number;
  membersSynced: number;
  errors: string[];
}

export class GitHubSyncService {
  private githubService: GitHubService;

  constructor(accessToken: string) {
    this.githubService = new GitHubService(accessToken);
  }

  /**
   * Sync user's GitHub organizations with the database
   */
  async syncUserOrganizations(userAuthkitId: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      organizationsSynced: 0,
      repositoriesSynced: 0,
      membersSynced: 0,
      errors: [],
    };

    try {
      // Get or create user
      const user = await this.getOrCreateUser(userAuthkitId);
      if (!user) {
        result.success = false;
        result.errors.push('Failed to create or find user');
        return result;
      }

      // Update user's GitHub information
      await this.updateUserGitHubInfo(user.id);

      // Get user's GitHub organizations
      const githubOrgs = await this.githubService.getUserOrganizations();
      
      for (const githubOrg of githubOrgs) {
        try {
          // Create or update organization
          const org = await this.createOrUpdateOrganization(githubOrg);
          result.organizationsSynced++;

          // Add user as member if not already
          await this.addUserToOrganization(user.id, org.id);

          // Sync repositories
          const repos = await this.githubService.getOrganizationRepositories(githubOrg.login);
          for (const repo of repos) {
            await this.createOrUpdateProject(org.id, repo);
            result.repositoriesSynced++;
          }

          // Sync organization members
          const members = await this.githubService.getOrganizationMembers(githubOrg.login);
          for (const member of members) {
            await this.syncOrganizationMember(org.id, member);
            result.membersSynced++;
          }

          // Update organization sync timestamp
          await db
            .update(organizations)
            .set({ lastSyncAt: new Date() })
            .where(eq(organizations.id, org.id));

          // Log successful sync
          await this.logSyncEvent(org.id, 'organization_sync', 'success', {
            repositoriesCount: repos.length,
            membersCount: members.length,
          });

        } catch (error) {
          const errorMsg = `Failed to sync organization ${githubOrg.login}: ${error.message}`;
          result.errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to sync organizations: ${error.message}`);
      console.error('GitHub sync error:', error);
    }

    return result;
  }

  /**
   * Sync a specific organization
   */
  async syncOrganization(organizationId: number, accessToken: string): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      organizationsSynced: 0,
      repositoriesSynced: 0,
      membersSynced: 0,
      errors: [],
    };

    try {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      });

      if (!org) {
        result.success = false;
        result.errors.push('Organization not found');
        return result;
      }

      const githubService = new GitHubService(accessToken);

      // Sync repositories
      const repos = await githubService.getOrganizationRepositories(org.name);
      for (const repo of repos) {
        await this.createOrUpdateProject(org.id, repo);
        result.repositoriesSynced++;
      }

      // Sync members
      const members = await githubService.getOrganizationMembers(org.name);
      for (const member of members) {
        await this.syncOrganizationMember(org.id, member);
        result.membersSynced++;
      }

      // Update sync timestamp
      await db
        .update(organizations)
        .set({ lastSyncAt: new Date() })
        .where(eq(organizations.id, org.id));

      // Log successful sync
      await this.logSyncEvent(org.id, 'organization_sync', 'success', {
        repositoriesCount: repos.length,
        membersCount: members.length,
      });

    } catch (error) {
      result.success = false;
      result.errors.push(`Failed to sync organization: ${error.message}`);
      console.error('Organization sync error:', error);
    }

    return result;
  }

  /**
   * Get or create user in database
   */
  private async getOrCreateUser(authkitId: string) {
    let user = await db.query.users.findFirst({
      where: eq(users.authkitId, authkitId),
    });

    if (!user) {
      const [newUser] = await db
        .insert(users)
        .values({ authkitId })
        .returning();
      user = newUser;
    }

    return user;
  }

  /**
   * Update user's GitHub information
   */
  private async updateUserGitHubInfo(userId: number) {
    try {
      const githubUser = await this.githubService.getAuthenticatedUser();
      
      await db
        .update(users)
        .set({
          githubId: githubUser.id,
          githubUsername: githubUser.login,
          githubEmail: githubUser.email,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Failed to update user GitHub info:', error);
    }
  }

  /**
   * Create or update organization
   */
  private async createOrUpdateOrganization(githubOrg: GitHubOrganization) {
    let org = await db.query.organizations.findFirst({
      where: eq(organizations.githubId, githubOrg.id),
    });

    if (org) {
      // Update existing organization
      const [updatedOrg] = await db
        .update(organizations)
        .set({
          name: githubOrg.login,
          updatedAt: new Date(),
        })
        .where(eq(organizations.id, org.id))
        .returning();
      return updatedOrg;
    } else {
      // Create new organization
      const [newOrg] = await db
        .insert(organizations)
        .values({
          githubId: githubOrg.id,
          name: githubOrg.login,
        })
        .returning();
      return newOrg;
    }
  }

  /**
   * Add user to organization
   */
  private async addUserToOrganization(userId: number, organizationId: number) {
    const existingMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, userId),
        eq(organizationMembers.organizationId, organizationId)
      ),
    });

    if (!existingMembership) {
      await db
        .insert(organizationMembers)
        .values({
          userId,
          organizationId,
        });
    }
  }

  /**
   * Create or update project
   */
  private async createOrUpdateProject(organizationId: number, githubRepo: GitHubRepository) {
    let project = await db.query.projects.findFirst({
      where: eq(projects.githubRepositoryId, githubRepo.id),
    });

    if (project) {
      // Update existing project
      await db
        .update(projects)
        .set({
          repositoryName: githubRepo.name,
          repositoryUrl: githubRepo.html_url,
          defaultBranch: githubRepo.default_branch,
          isPrivate: githubRepo.private,
          updatedAt: new Date(),
        })
        .where(eq(projects.id, project.id));
    } else {
      // Create new project
      await db
        .insert(projects)
        .values({
          organizationId,
          githubRepositoryId: githubRepo.id,
          repositoryName: githubRepo.name,
          repositoryUrl: githubRepo.html_url,
          defaultBranch: githubRepo.default_branch,
          isPrivate: githubRepo.private,
        });
    }
  }

  /**
   * Sync organization member
   */
  private async syncOrganizationMember(organizationId: number, githubUser: GitHubUser) {
    // Find or create user
    let user = await db.query.users.findFirst({
      where: eq(users.githubId, githubUser.id),
    });

    if (!user) {
      // Create user with GitHub info
      const [newUser] = await db
        .insert(users)
        .values({
          authkitId: `github_${githubUser.id}`, // Temporary authkit ID for GitHub users
          githubId: githubUser.id,
          githubUsername: githubUser.login,
        })
        .returning();
      user = newUser;
    }

    // Add or update membership
    const existingMembership = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.userId, user.id),
        eq(organizationMembers.organizationId, organizationId)
      ),
    });

    if (existingMembership) {
      // Update existing membership
      await db
        .update(organizationMembers)
        .set({
          githubMembershipActive: true,
          lastSyncAt: new Date(),
        })
        .where(eq(organizationMembers.id, existingMembership.id));
    } else {
      // Create new membership
      await db
        .insert(organizationMembers)
        .values({
          userId: user.id,
          organizationId,
          githubMembershipActive: true,
          lastSyncAt: new Date(),
        });
    }
  }

  /**
   * Log sync event
   */
  private async logSyncEvent(
    organizationId: number,
    syncType: string,
    status: string,
    details?: any,
    error?: string
  ) {
    await db
      .insert(githubSyncLogs)
      .values({
        organizationId,
        syncType,
        status,
        details,
        error,
      });
  }

  /**
   * Get sync logs for an organization
   */
  async getSyncLogs(organizationId: number, limit: number = 50) {
    return db.query.githubSyncLogs.findMany({
      where: eq(githubSyncLogs.organizationId, organizationId),
      orderBy: (logs, { desc }) => [desc(logs.createdAt)],
      limit,
    });
  }
}
