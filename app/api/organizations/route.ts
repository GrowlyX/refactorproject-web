// app/api/organizations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {authkit} from "@workos-inc/authkit-nextjs";
import {checkUserOrgAccess, getPlatformUser, getUserOrganizationsWithSyncStatus} from "@/lib/db/queries";
import {getGitHubSyncService} from "@/lib/github/github-sync";
import {db} from "@/lib/db/drizzle";
import {organizationMembers} from "@/lib/db/schema";

export async function GET(request: NextRequest) {
    try {
        // Get user info from your auth system (WorkOS)
        const { session } = await authkit(request);
        if (!session.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = session

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search');
        const status = searchParams.get('status');
        const syncStatus = searchParams.get('syncStatus');

        // Get user's organizations with sync status
        let organizations = await getUserOrganizationsWithSyncStatus({ user });

        // Apply filters
        if (search) {
            const searchLower = search.toLowerCase();
            organizations = organizations.filter(org =>
                org.name.toLowerCase().includes(searchLower)
            );
        }

        if (status && status !== 'all') {
            organizations = organizations.filter(org => org.status === status);
        }

        if (syncStatus && syncStatus !== 'all') {
            organizations = organizations.filter(org => {
                switch (syncStatus) {
                    case 'synced':
                        return org.githubAppInstalled && org.lastSyncStatus !== 'error';
                    case 'error':
                        return org.lastSyncStatus === 'error';
                    case 'needs_sync':
                        const hoursOld = org.lastSyncAt
                            ? (Date.now() - new Date(org.lastSyncAt).getTime()) / (1000 * 60 * 60)
                            : Infinity;
                        return !org.lastSyncAt || hoursOld > 24;
                    case 'no_app':
                        return !org.githubAppInstalled;
                    default:
                        return true;
                }
            });
        }

        // Transform data for frontend
        const transformedOrgs = organizations.map(org => ({
            id: org.id,
            githubId: org.githubId,
            name: org.name,
            displayName: org.name, // You might want to store display names separately
            status: org.status,
            githubAppInstalled: org.githubAppInstalled,
            lastSyncAt: org.lastSyncAt,
            lastSyncStatus: org.lastSyncStatus,
            githubMembershipActive: org.githubMembershipActive,
            projectCount: org.projectCount,
            memberCount: org.memberCount,
            joinedAt: org.joinedAt,
            createdAt: new Date().toISOString(), // You might want to add this to your schema
        }));

        return NextResponse.json(transformedOrgs);

    } catch (error) {
        console.error('Error fetching organizations:', error);
        return NextResponse.json(
            { error: 'Failed to fetch organizations' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        // Get user info from your auth system (WorkOS)
        const { session } = await authkit(request);
        if (!session.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = session


        const body = await request.json();
        const { githubOrgName, githubOrgId } = body;

        if (!githubOrgName && !githubOrgId) {
            return NextResponse.json(
                { error: 'Either githubOrgName or githubOrgId is required' },
                { status: 400 }
            );
        }

        const githubService = await getGitHubSyncService();
        const platformUser = await getPlatformUser({ user });

        // If only name provided, get the GitHub org details
        let orgName = githubOrgName;
        let orgGithubId = githubOrgId;

        if (githubOrgName && !githubOrgId) {
            try {
                const installationStatus = await githubService.checkAppInstallation(githubOrgName);
                if (!installationStatus.isInstalled) {
                    return NextResponse.json({
                        error: 'GitHub App is not installed on this organization',
                        needsInstallation: true,
                        githubAppUrl: `https://github.com/apps/${process.env.NEXT_PUBLIC_GITHUB_APP_NAME}/installations/new`
                    }, { status: 400 });
                }
                orgGithubId = installationStatus.orgId;
            } catch (error) {
                return NextResponse.json({
                    error: 'Organization not found or inaccessible',
                    details: error.message
                }, { status: 404 });
            }
        }

        // Check if user is member of the GitHub organization
        if (platformUser.githubUsername) {
            const isMember = await githubService.checkUserOrgMembership(orgName, platformUser.githubUsername);
            if (!isMember) {
                return NextResponse.json({
                    error: 'You are not a member of this GitHub organization',
                    needsMembership: true
                }, { status: 403 });
            }
        } else {
            return NextResponse.json({
                error: 'GitHub account not linked. Please link your GitHub account in profile settings.',
                needsGithubLink: true
            }, { status: 400 });
        }

        // Sync the organization (creates if doesn't exist)
        const { organization, isNew } = await githubService.syncOrganization(orgName);

        // Add user as member if they're not already
        const existingMembership = await checkUserOrgAccess(platformUser.id, organization.id);
        if (!existingMembership) {
            await db
                .insert(organizationMembers)
                .values({
                    organizationId: organization.id,
                    userId: platformUser.id,
                    githubMembershipActive: true,
                })
                .onConflictDoNothing();
        }

        // Sync all members
        await githubService.syncOrganizationMembers(organization.id, orgName);

        return NextResponse.json({
            success: true,
            organization: {
                id: organization.id,
                githubId: organization.githubId,
                name: organization.name,
                status: organization.status,
                githubAppInstalled: organization.githubAppInstalled,
                lastSyncAt: organization.lastSyncAt,
            },
            isNew,
            message: isNew ? 'Organization created and synced successfully' : 'Organization synced successfully'
        }, { status: isNew ? 201 : 200 });

    } catch (error) {
        console.error('Error creating/syncing organization:', error);
        return NextResponse.json(
            {
                error: 'Failed to create organization',
                details: error.message
            },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const { session } = await authkit(request);
        if (!session.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }
        const user = session

        const body = await request.json();
        const { organizationId, action, ...updateData } = body;

        if (!organizationId) {
            return NextResponse.json(
                { error: 'Organization ID is required' },
                { status: 400 }
            );
        }

        const platformUser = await getPlatformUser({ user });
        const hasAccess = await checkUserOrgAccess(platformUser.id, organizationId);

        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Access denied to this organization' },
                { status: 403 }
            );
        }

        const githubService = await getGitHubSyncService();

        switch (action) {
            case 'sync':
                // Get organization details for sync
                const organizations = await getUserOrganizationsWithSyncStatus({ user });
                const targetOrg = organizations.find(org => org.id === organizationId);

                if (!targetOrg) {
                    return NextResponse.json(
                        { error: 'Organization not found' },
                        { status: 404 }
                    );
                }

                await githubService.syncOrganizationMembers(organizationId, targetOrg.name);

                return NextResponse.json({
                    success: true,
                    message: 'Organization synced successfully'
                });

            case 'update':
                // Handle general updates (if needed in the future)
                return NextResponse.json({
                    success: true,
                    message: 'Organization updated successfully'
                });

            default:
                return NextResponse.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                );
        }

    } catch (error) {
        console.error('Error updating organization:', error);
        return NextResponse.json(
            {
                error: 'Failed to update organization',
                details: error.message
            },
            { status: 500 }
        );
    }
}
