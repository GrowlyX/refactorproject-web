import { NextRequest, NextResponse } from 'next/server';
import { GitHubAppService } from '@/lib/github/github-app';
import { GitHubSyncService } from '@/lib/github/github-sync';
import { db } from '@/lib/db/drizzle';
import { pendingInstallations, organizations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-hub-signature-256');
    
    // Verify webhook signature (optional but recommended)
    const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    if (webhookSecret && signature) {
      // Add signature verification logic here if needed
    }

    const event = JSON.parse(body);
    const eventType = request.headers.get('x-github-event');

    console.log(`Received GitHub webhook: ${eventType}`, event);

    // Handle installation events
    if (eventType === 'installation') {
      await handleInstallationEvent(event);
    } else if (eventType === 'installation_repositories') {
      await handleInstallationRepositoriesEvent(event);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('GitHub webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function handleInstallationEvent(event: any) {
  const { action, installation } = event;

  if (action === 'created') {
    // Store pending installation
    await db
      .insert(pendingInstallations)
      .values({
        githubOrgId: installation.account.id,
        orgName: installation.account.login,
        installedAt: new Date(),
      })
      .onConflictDoNothing();

    console.log(`New installation created for ${installation.account.login}`);

    // Automatically sync the new installation
    try {
      const githubSyncService = new GitHubSyncService(
        process.env.GITHUB_APP_ID!,
        process.env.GITHUB_PRIVATE_KEY!
      );

      const syncResult = await githubSyncService.syncInstallation(installation.id);
      console.log(`Auto-sync completed for ${installation.account.login}:`, {
        organizationsSynced: syncResult.organizationsSynced,
        repositoriesSynced: syncResult.repositoriesSynced,
        membersSynced: syncResult.membersSynced,
        errors: syncResult.errors,
      });
    } catch (error) {
      console.error(`Auto-sync failed for ${installation.account.login}:`, error);
    }
  } else if (action === 'deleted') {
    // Handle installation deletion
    console.log(`Installation deleted for ${installation.account.login}`);
    
    // Update organization status
    try {
      const githubSyncService = new GitHubSyncService(
        process.env.GITHUB_APP_ID!,
        process.env.GITHUB_PRIVATE_KEY!
      );
      
      // Mark organization as not installed
      await db
        .update(organizations)
        .set({
          githubAppInstalled: false,
          status: 'inactive',
        })
        .where(eq(organizations.name, installation.account.login));
        
      console.log(`Marked organization ${installation.account.login} as inactive`);
    } catch (error) {
      console.error(`Failed to update organization status for ${installation.account.login}:`, error);
    }
  }
}

async function handleInstallationRepositoriesEvent(event: any) {
  const { action, installation, repositories_added, repositories_removed } = event;

  if (action === 'added' && repositories_added?.length > 0) {
    console.log(`Repositories added to installation: ${repositories_added.length}`);
  } else if (action === 'removed' && repositories_removed?.length > 0) {
    console.log(`Repositories removed from installation: ${repositories_removed.length}`);
  }
}

