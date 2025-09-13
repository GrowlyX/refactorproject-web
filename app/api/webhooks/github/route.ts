// app/api/webhooks/github/route.ts
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import {db} from "@/lib/db/drizzle";
import {organizations} from "@/lib/db/schema";

// Verify the webhook signature to ensure it's from GitHub
function verifyGitHubSignature(payload: string, signature: string): boolean {
    if (!signature) return false;

    const hmac = crypto.createHmac('sha256', process.env.GITHUB_WEBHOOK_SECRET!);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(digest)
    );
}

export async function POST(request: NextRequest) {
    try {
        const payload = await request.text();
        const signature = request.headers.get('x-hub-signature-256');

        // Verify the webhook is actually from GitHub
        if (!verifyGitHubSignature(payload, signature || '')) {
            console.error('Invalid GitHub webhook signature');
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const event = JSON.parse(payload);
        const eventType = request.headers.get('x-github-event');

        console.log(`Received GitHub webhook: ${eventType}`, {
            action: event.action,
            organization: event.installation?.account?.login || event.organization?.login
        });

        switch (eventType) {
            case 'installation':
                await handleInstallationEvent(event);
                break;

            case 'installation_repositories':
                await handleInstallationRepositoriesEvent(event);
                break;

            case 'organization':
                await handleOrganizationEvent(event);
                break;

            case 'member':
            case 'membership':
                await handleMembershipEvent(event);
                break;

            default:
                console.log(`Unhandled webhook event: ${eventType}`);
        }

        return Response.json({ success: true });

    } catch (error) {
        console.error('GitHub webhook processing error:', error);
        return Response.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        );
    }
}

// Handle app installation/uninstallation
async function handleInstallationEvent(event: any) {
    const { action, installation } = event;
    const orgLogin = installation.account.login;
    const githubOrgId = installation.account.id;

    switch (action) {
        case 'created':
            console.log(`GitHub App installed on organization: ${orgLogin}`);

            // Optionally, you could auto-create the organization here
            // But it's better to wait for a user to explicitly add it
            // This ensures proper user-org association

            // You could store pending installations for faster polling
            await storePendingInstallation(githubOrgId, orgLogin);
            break;

        case 'deleted':
            console.log(`GitHub App uninstalled from organization: ${orgLogin}`);

            // Handle app uninstallation - maybe disable the org or notify users
            await handleAppUninstallation(githubOrgId);
            break;

        case 'suspend':
            console.log(`GitHub App suspended on organization: ${orgLogin}`);
            await handleAppSuspension(githubOrgId);
            break;

        case 'unsuspend':
            console.log(`GitHub App unsuspended on organization: ${orgLogin}`);
            await handleAppUnsuspension(githubOrgId);
            break;
    }
}

// Handle repository access changes
async function handleInstallationRepositoriesEvent(event: any) {
    const { action, installation, repositories_added, repositories_removed } = event;
    const orgLogin = installation.account.login;

    if (action === 'added' && repositories_added) {
        console.log(`New repositories added to ${orgLogin}:`,
            repositories_added.map((repo: any) => repo.name));
    }

    if (action === 'removed' && repositories_removed) {
        console.log(`Repositories removed from ${orgLogin}:`,
            repositories_removed.map((repo: any) => repo.name));
    }
}

// Handle organization changes
async function handleOrganizationEvent(event: any) {
    const { action, organization } = event;

    switch (action) {
        case 'renamed':
            // Update organization name in your database
            await updateOrganizationName(organization.id, organization.login);
            break;

        case 'deleted':
            // Handle organization deletion
            await handleOrganizationDeletion(organization.id);
            break;
    }
}

// Handle membership changes
async function handleMembershipEvent(event: any) {
    const { action, organization, member } = event;

    // This helps maintain security - if someone is removed from the GitHub org,
    // you might want to remove their access to your app as well

    switch (action) {
        case 'removed':
            console.log(`Member ${member.login} removed from ${organization.login}`);
            // Optionally remove user access to the organization in your app
            await handleMemberRemoval(organization.id, member.login);
            break;

        case 'added':
            console.log(`Member ${member.login} added to ${organization.login}`);
            break;
    }
}

// Helper functions for database operations
async function storePendingInstallation(githubOrgId: number, orgLogin: string) {
    try {
        // Store in a temporary table or cache for faster polling detection
        // This is optional but can speed up the user experience

        console.log(`Stored pending installation for ${orgLogin} (${githubOrgId})`);
    } catch (error) {
        console.error('Error storing pending installation:', error);
    }
}

async function handleAppUninstallation(githubOrgId: number) {
    try {
        // Find the organization in your database
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.githubId, githubOrgId),
        });

        if (org) {
            // You might want to:
            // 1. Mark the organization as inactive
            // 2. Notify all members
            // 3. Disable access to projects
            // 4. Or completely remove it (be careful!)

            console.log(`Handling uninstallation for org ID ${org.id}`);

            // Example: Mark as inactive instead of deleting
            // await db.update(organizations)
            //     .set({ isActive: false, updatedAt: new Date() })
            //     .where(eq(organizations.id, org.id));
        }
    } catch (error) {
        console.error('Error handling app uninstallation:', error);
    }
}

async function handleAppSuspension(githubOrgId: number) {
    // Similar to uninstallation but temporary
    console.log(`App suspended for GitHub org ${githubOrgId}`);
}

async function handleAppUnsuspension(githubOrgId: number) {
    // Re-enable access
    console.log(`App unsuspended for GitHub org ${githubOrgId}`);
}

async function updateOrganizationName(githubOrgId: number, newName: string) {
    try {
        await db.update(organizations)
            .set({
                name: newName,
                updatedAt: new Date()
            })
            .where(eq(organizations.githubId, githubOrgId));

        console.log(`Updated organization name to ${newName}`);
    } catch (error) {
        console.error('Error updating organization name:', error);
    }
}

async function handleOrganizationDeletion(githubOrgId: number) {
    try {
        // Handle when the GitHub organization itself is deleted
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.githubId, githubOrgId),
        });

        if (org) {
            // Decide what to do - archive, delete, or mark as inactive
            console.log(`GitHub organization deleted, handling cleanup for org ID ${org.id}`);
        }
    } catch (error) {
        console.error('Error handling organization deletion:', error);
    }
}

async function handleMemberRemoval(githubOrgId: number, githubUsername: string) {
    try {
        // Find the organization
        const org = await db.query.organizations.findFirst({
            where: eq(organizations.githubId, githubOrgId),
        });

        if (org) {
            // Find user by GitHub username (you'd need to store this)
            // and remove them from the organization in your app
            console.log(`Member ${githubUsername} removed from GitHub org, considering access removal`);

            // This requires storing GitHub usernames in your user profiles
            // You might want to be cautious here and just log for manual review
        }
    } catch (error) {
        console.error('Error handling member removal:', error);
    }
}
