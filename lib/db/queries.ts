// lib/queries.ts
import { and, desc, eq, ilike, or, sql, inArray } from 'drizzle-orm';
import { db } from './drizzle';
import {
    organizations,
    organizationMembers,
    projects,
    users
} from './schema';
import {UserInfo} from "@workos-inc/authkit-nextjs";
import {createOrganizationFromGitHub} from "@/lib/github/githubActions";

// User management
export async function getPlatformUser(userInfo: UserInfo) {
    const authkitId = userInfo.user.id;

    // Try to find existing user
    let user = await db.query.users.findFirst({
        where: eq(users.authkitId, authkitId),
    });

    // Create user if doesn't exist
    if (!user) {
        const [newUser] = await db
            .insert(users)
            .values({
                authkitId,
            })
            .returning();

        user = newUser;
    }

    return user;
}

export async function getUserById(userId: number) {
    return db.query.users.findFirst({
        where: eq(users.id, userId),
    });
}

export async function getUserByAuthkitId(authkitId: string) {
    return db.query.users.findFirst({
        where: eq(users.authkitId, authkitId),
    });
}

// Organization queries
export async function getUserOrganizations(userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    const memberships = await db
        .select({
            id: organizations.id,
            githubId: organizations.githubId,
            name: organizations.name,
            joinedAt: organizationMembers.joinedAt,
            projectCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${projects} p
        WHERE p.organization_id = ${organizations.id}
      )`,
            memberCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${organizationMembers} om
        WHERE om.organization_id = ${organizations.id}
      )`,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(eq(organizationMembers.userId, user.id))
        .orderBy(organizations.name);

    return memberships;
}

export async function getOrganizationById(organizationId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, organizationId);
    if (!hasAccess) return null;

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
    });

    if (!org) return null;

    // Get stats
    const stats = await db
        .select({
            memberCount: sql<number>`COUNT(DISTINCT ${organizationMembers.userId})::int`,
            projectCount: sql<number>`COUNT(DISTINCT ${projects.id})::int`,
        })
        .from(organizations)
        .leftJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
        .leftJoin(projects, eq(organizations.id, projects.organizationId))
        .where(eq(organizations.id, org.id))
        .groupBy(organizations.id);

    return {
        ...org,
        memberCount: stats[0]?.memberCount || 0,
        projectCount: stats[0]?.projectCount || 0,
    };
}

export async function getOrganizationByGithubId(githubId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.githubId, githubId),
    });

    if (!org) return null;

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, org.id);
    if (!hasAccess) return null;

    // Get stats
    const stats = await db
        .select({
            memberCount: sql<number>`COUNT(DISTINCT ${organizationMembers.userId})::int`,
            projectCount: sql<number>`COUNT(DISTINCT ${projects.id})::int`,
        })
        .from(organizations)
        .leftJoin(organizationMembers, eq(organizations.id, organizationMembers.organizationId))
        .leftJoin(projects, eq(organizations.id, projects.organizationId))
        .where(eq(organizations.id, org.id))
        .groupBy(organizations.id);

    return {
        ...org,
        memberCount: stats[0]?.memberCount || 0,
        projectCount: stats[0]?.projectCount || 0,
    };
}

export async function createOrganization(githubId: number, name: string, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Create organization
    const [org] = await db
        .insert(organizations)
        .values({
            githubId,
            name,
        })
        .returning();

    // Add creator as member
    await db
        .insert(organizationMembers)
        .values({
            organizationId: org.id,
            userId: user.id,
        });

    return org;
}

export async function updateOrganization(organizationId: number, updates: { name?: string }, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, organizationId);
    if (!hasAccess) return null;

    const [org] = await db
        .update(organizations)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(eq(organizations.id, organizationId))
        .returning();

    return org;
}

export async function deleteOrganization(organizationId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, organizationId);
    if (!hasAccess) return false;

    await db
        .delete(organizations)
        .where(eq(organizations.id, organizationId));

    return true;
}

// Organization member management
export async function getOrganizationMembers(organizationId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, organizationId);
    if (!hasAccess) return [];

    return db
        .select({
            id: users.id,
            authkitId: users.authkitId,
            joinedAt: organizationMembers.joinedAt,
            membershipId: organizationMembers.id,
        })
        .from(organizationMembers)
        .innerJoin(users, eq(organizationMembers.userId, users.id))
        .where(eq(organizationMembers.organizationId, organizationId))
        .orderBy(organizationMembers.joinedAt);
}

export async function addOrganizationMember(organizationId: number, userAuthkitId: string, userInfo: UserInfo) {
    const currentUser = await getPlatformUser(userInfo);

    // Check if current user has access to the organization
    const hasAccess = await checkUserOrgAccess(currentUser.id, organizationId);
    if (!hasAccess) return null;

    // Get or create the user to be added
    const targetUser = await db.query.users.findFirst({
        where: eq(users.authkitId, userAuthkitId),
    });

    if (!targetUser) {
        // Create user if they don't exist
        const [newUser] = await db
            .insert(users)
            .values({
                authkitId: userAuthkitId,
            })
            .returning();

        // Add as member
        const [membership] = await db
            .insert(organizationMembers)
            .values({
                organizationId,
                userId: newUser.id,
            })
            .returning();

        return { user: newUser, membership };
    }

    // Check if already a member
    const existingMembership = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.organizationId, organizationId),
            eq(organizationMembers.userId, targetUser.id)
        ),
    });

    if (existingMembership) {
        return { user: targetUser, membership: existingMembership };
    }

    // Add as member
    const [membership] = await db
        .insert(organizationMembers)
        .values({
            organizationId,
            userId: targetUser.id,
        })
        .returning();

    return { user: targetUser, membership };
}

export async function removeOrganizationMember(organizationId: number, userId: number, userInfo: UserInfo) {
    const currentUser = await getPlatformUser(userInfo);

    // Check if current user has access
    const hasAccess = await checkUserOrgAccess(currentUser.id, organizationId);
    if (!hasAccess) return false;

    await db
        .delete(organizationMembers)
        .where(
            and(
                eq(organizationMembers.organizationId, organizationId),
                eq(organizationMembers.userId, userId)
            )
        );

    return true;
}

export async function checkUserOrgAccess(userId: number, organizationId: number) {
    const membership = await db.query.organizationMembers.findFirst({
        where: and(
            eq(organizationMembers.userId, userId),
            eq(organizationMembers.organizationId, organizationId)
        ),
    });

    return membership;
}

export async function getUserOrgAccess(userInfo: UserInfo, organizationId: number) {
    const user = await getPlatformUser(userInfo);
    return checkUserOrgAccess(user.id, organizationId);
}

// Project queries
export async function getOrganizationProjects(organizationId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, organizationId);
    if (!hasAccess) return [];

    return db
        .select({
            id: projects.id,
            githubRepositoryId: projects.githubRepositoryId,
            moduleInterlinks: projects.moduleInterlinks,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
        .orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
        with: {
            organization: true,
        },
    });

    if (!project) return null;

    // Check if user has access to this project's organization
    const hasAccess = await checkUserOrgAccess(user.id, project.organizationId);
    if (!hasAccess) return null;

    return project;
}

export async function getProjectByGithubRepoId(githubRepositoryId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    const project = await db.query.projects.findFirst({
        where: eq(projects.githubRepositoryId, githubRepositoryId),
        with: {
            organization: true,
        },
    });

    if (!project) return null;

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, project.organizationId);
    if (!hasAccess) return null;

    return project;
}

export async function createProject(
    organizationId: number,
    githubRepositoryId: number,
    userInfo: UserInfo,
    moduleInterlinks?: any,
) {
    const user = await getPlatformUser(userInfo);

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, organizationId);
    if (!hasAccess) return null;

    const [project] = await db
        .insert(projects)
        .values({
            organizationId,
            githubRepositoryId,
            moduleInterlinks,
        })
        .returning();

    return project;
}

export async function updateProject(
    projectId: number,
    updates: {
        moduleInterlinks?: any;
    },
    userInfo: UserInfo
) {
    const user = await getPlatformUser(userInfo);

    // Get project to check organization access
    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    if (!project) return null;

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, project.organizationId);
    if (!hasAccess) return null;

    const [updatedProject] = await db
        .update(projects)
        .set({
            ...updates,
            updatedAt: new Date(),
        })
        .where(eq(projects.id, projectId))
        .returning();

    return updatedProject;
}

export async function deleteProject(projectId: number, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Get project to check organization access
    const project = await db.query.projects.findFirst({
        where: eq(projects.id, projectId),
    });

    if (!project) return false;

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, project.organizationId);
    if (!hasAccess) return false;

    await db
        .delete(projects)
        .where(eq(projects.id, projectId));

    return true;
}

// Search and filtering
export async function searchUserOrganizations(query: string, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    if (!query) {
        return getUserOrganizations(userInfo);
    }

    const memberships = await db
        .select({
            id: organizations.id,
            githubId: organizations.githubId,
            name: organizations.name,
            joinedAt: organizationMembers.joinedAt,
            projectCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${projects} p
        WHERE p.organization_id = ${organizations.id}
      )`,
            memberCount: sql<number>`(
        SELECT COUNT(*)::int
        FROM ${organizationMembers} om
        WHERE om.organization_id = ${organizations.id}
      )`,
        })
        .from(organizationMembers)
        .innerJoin(organizations, eq(organizationMembers.organizationId, organizations.id))
        .where(
            and(
                eq(organizationMembers.userId, user.id),
                ilike(organizations.name, `%${query}%`)
            )
        )
        .orderBy(organizations.name)
        .limit(20);

    return memberships;
}

export async function searchProjects(organizationId: number, query: string, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Check if user has access
    const hasAccess = await checkUserOrgAccess(user.id, organizationId);
    if (!hasAccess) return [];

    if (!query) {
        return getOrganizationProjects(organizationId, userInfo);
    }

    // For now, we can't easily search inside JSONB without more complex queries
    // This could be enhanced with full-text search on module names if needed
    return db
        .select({
            id: projects.id,
            githubRepositoryId: projects.githubRepositoryId,
            moduleInterlinks: projects.moduleInterlinks,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
        })
        .from(projects)
        .where(eq(projects.organizationId, organizationId))
        .orderBy(desc(projects.updatedAt))
        .limit(20);
}

// Dashboard stats
export async function getDashboardStats(userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    // Get user's organizations
    const userOrgs = await getUserOrganizations(userInfo);
    const orgIds = userOrgs.map(org => org.id);

    if (orgIds.length === 0) {
        return {
            totalOrganizations: 0,
            totalProjects: 0,
            recentProjects: [],
        };
    }

    // Get project count
    const projectStats = await db
        .select({
            count: sql<number>`COUNT(*)::int`,
        })
        .from(projects)
        .where(inArray(projects.organizationId, orgIds));

    // Get recent projects
    const recentProjects = await db
        .select({
            id: projects.id,
            githubRepositoryId: projects.githubRepositoryId,
            createdAt: projects.createdAt,
            updatedAt: projects.updatedAt,
            organization: {
                name: organizations.name,
                githubId: organizations.githubId,
            },
        })
        .from(projects)
        .innerJoin(organizations, eq(projects.organizationId, organizations.id))
        .where(inArray(projects.organizationId, orgIds))
        .orderBy(desc(projects.updatedAt))
        .limit(5);

    return {
        totalOrganizations: userOrgs.length,
        totalProjects: projectStats[0]?.count || 0,
        recentProjects,
    };
}
// API Route Handlers (create these files in your Next.js app/api directory)

// app/api/organizations/check/[orgName]/route.ts


// app/api/organizations/poll/route.ts


// Helper function to get current user info (implement based on your WorkOS setup)
async function getCurrentUserInfo(request: Request): Promise<UserInfo | null> {
    // Implement based on your WorkOS authentication setup
    // This should extract the user information from the request
    // and return it in the UserInfo format

    // Example:
    // const session = await getSession(request);
    // if (!session) return null;
    //
    // return {
    //     user: {
    //         id: session.userId,
    //         email: session.userEmail,
    //         // ... other fields
    //     },
    //     // ... other session info
    // };



    throw new Error('getCurrentUserInfo not implemented - integrate with your WorkOS setup');
}
