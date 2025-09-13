import {db} from "@/lib/db/drizzle";
import {and, eq} from "drizzle-orm";
import {organizationMembers, organizations} from "@/lib/db/schema";
import {getPlatformUser} from "@/lib/db/queries";
import {UserInfo} from "@workos-inc/authkit-nextjs";

export async function checkGitHubOrganization(orgName: string, userInfo: UserInfo) {
    try {
        // You'll need to set up GitHub App credentials in your environment
        const githubToken = process.env.GITHUB_APP_TOKEN;

        if (!githubToken) {
            throw new Error('GitHub App not configured');
        }

        // Check if organization exists on GitHub
        const orgResponse = await fetch(`https://api.github.com/orgs/${orgName}`, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (orgResponse.status === 404) {
            return { exists: false, data: null };
        }

        if (!orgResponse.ok) {
            throw new Error(`GitHub API error: ${orgResponse.status}`);
        }

        const orgData = await orgResponse.json();

        // Check if user is a member of the organization
        const memberResponse = await fetch(`https://api.github.com/orgs/${orgName}/members/${userInfo.user.email}`, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        const isMember = memberResponse.status === 204;

        return {
            exists: true,
            data: orgData,
            isMember,
        };
    } catch (error) {
        console.error('Error checking GitHub organization:', error);
        throw error;
    }
}

export async function checkGitHubAppInstallation(orgName: string, userInfo: UserInfo) {
    try {
        const githubAppId = process.env.GITHUB_APP_ID;
        const githubToken = process.env.GITHUB_APP_TOKEN;

        if (!githubAppId || !githubToken) {
            throw new Error('GitHub App not configured');
        }

        // Check if our app is installed on the organization
        const installationsResponse = await fetch(`https://api.github.com/app/installations`, {
            headers: {
                'Authorization': `Bearer ${githubToken}`,
                'Accept': 'application/vnd.github.v3+json',
            },
        });

        if (!installationsResponse.ok) {
            throw new Error('Failed to fetch installations');
        }

        const installations = await installationsResponse.json();

        const orgInstallation = installations.find((installation: any) =>
            installation.account.login.toLowerCase() === orgName.toLowerCase()
        );

        return {
            isInstalled: !!orgInstallation,
            installation: orgInstallation,
        };
    } catch (error) {
        console.error('Error checking GitHub App installation:', error);
        throw error;
    }
}

export async function validateUserOrgAccess(orgName: string, userInfo: UserInfo) {
    try {
        // First check if org exists and user is a member
        const githubOrg = await checkGitHubOrganization(orgName, userInfo);

        if (!githubOrg.exists) {
            return {
                valid: false,
                error: 'Organization not found on GitHub'
            };
        }

        if (!githubOrg.isMember) {
            return {
                valid: false,
                error: 'You are not a member of this GitHub organization'
            };
        }

        // Check if our app is installed
        const appInstallation = await checkGitHubAppInstallation(orgName, userInfo);

        if (!appInstallation.isInstalled) {
            return {
                valid: false,
                error: 'GitHub App is not installed on this organization'
            };
        }

        return {
            valid: true,
            githubData: githubOrg.data,
            installationData: appInstallation.installation
        };
    } catch (error) {
        console.error('Error validating user org access:', error);
        return {
            valid: false,
            error: 'Failed to validate organization access'
        };
    }
}

export async function createOrganizationFromGitHub(orgName: string, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    try {
        // Validate access first
        const validation = await validateUserOrgAccess(orgName, userInfo);

        if (!validation.valid) {
            throw new Error(validation.error);
        }

        const { githubData } = validation;

        // Check if organization already exists in our database
        const existingOrg = await db.query.organizations.findFirst({
            where: eq(organizations.githubId, githubData.id),
        });

        if (existingOrg) {
            // Check if user is already a member
            const existingMembership = await db.query.organizationMembers.findFirst({
                where: and(
                    eq(organizationMembers.organizationId, existingOrg.id),
                    eq(organizationMembers.userId, user.id)
                ),
            });

            if (existingMembership) {
                return {
                    success: false,
                    error: 'You already have access to this organization'
                };
            }

            // Add user as member of existing organization
            await db
                .insert(organizationMembers)
                .values({
                    organizationId: existingOrg.id,
                    userId: user.id,
                });

            return {
                success: true,
                organization: existingOrg,
                wasExisting: true
            };
        }

        // Create new organization
        const [newOrg] = await db
            .insert(organizations)
            .values({
                githubId: githubData.id,
                name: githubData.login,
            })
            .returning();

        // Add creator as member
        await db
            .insert(organizationMembers)
            .values({
                organizationId: newOrg.id,
                userId: user.id,
            });

        return {
            success: true,
            organization: newOrg,
            wasExisting: false
        };
    } catch (error) {
        console.error('Error creating organization from GitHub:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to create organization'
        };
    }
}

// Check if organization exists in our database and user has access
export async function checkExistingOrgAccess(orgName: string, userInfo: UserInfo) {
    const user = await getPlatformUser(userInfo);

    try {
        // First check GitHub to get the org ID
        const githubOrg = await checkGitHubOrganization(orgName, userInfo);

        if (!githubOrg.exists) {
            return { exists: false, hasAccess: false };
        }

        // Check if exists in our database
        const existingOrg = await db.query.organizations.findFirst({
            where: eq(organizations.githubId, githubOrg.data.id),
        });

        if (!existingOrg) {
            return { exists: false, hasAccess: false };
        }

        // Check if user has access
        const membership = await db.query.organizationMembers.findFirst({
            where: and(
                eq(organizationMembers.organizationId, existingOrg.id),
                eq(organizationMembers.userId, user.id)
            ),
        });

        return {
            exists: true,
            hasAccess: !!membership,
            organization: existingOrg
        };
    } catch (error) {
        console.error('Error checking existing org access:', error);
        return { exists: false, hasAccess: false };
    }
}
