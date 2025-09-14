/**
 * Background sync scheduler for GitHub organizations
 * This runs periodic syncs to keep organization data up to date
 */

import { GitHubSyncService } from '../github/github-sync';

export class SyncScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;
  private githubSyncService: GitHubSyncService;

  constructor() {
    // Initialize GitHub sync service
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_PRIVATE_KEY;

    if (!appId || !privateKey) {
      throw new Error('GitHub App configuration missing');
    }

    this.githubSyncService = new GitHubSyncService(appId, privateKey);
  }

  /**
   * Start the background sync scheduler
   * @param intervalMinutes - Interval in minutes (default: 60 minutes)
   */
  start(intervalMinutes: number = 60) {
    if (this.isRunning) {
      console.log('Sync scheduler is already running');
      return;
    }

    const intervalMs = intervalMinutes * 60 * 1000;
    
    console.log(`Starting sync scheduler with ${intervalMinutes} minute intervals`);
    
    this.isRunning = true;
    this.intervalId = setInterval(async () => {
      await this.runBackgroundSync();
    }, intervalMs);

    // Run initial sync
    this.runBackgroundSync();
  }

  /**
   * Stop the background sync scheduler
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('Sync scheduler stopped');
  }

  /**
   * Run background sync for all organizations
   */
  private async runBackgroundSync() {
    try {
      console.log('Running background sync...');
      const result = await this.githubSyncService.backgroundSyncAll();
      
      console.log('Background sync completed:', {
        organizationsSynced: result.organizationsSynced,
        repositoriesSynced: result.repositoriesSynced,
        membersSynced: result.membersSynced,
        errors: result.errors.length,
      });

      if (result.errors.length > 0) {
        console.error('Background sync errors:', result.errors);
      }
    } catch (error) {
      console.error('Background sync failed:', error);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null,
    };
  }
}

// Global scheduler instance
let globalScheduler: SyncScheduler | null = null;

/**
 * Get or create the global sync scheduler
 */
export function getSyncScheduler(): SyncScheduler {
  if (!globalScheduler) {
    globalScheduler = new SyncScheduler();
  }
  return globalScheduler;
}

/**
 * Start the global sync scheduler
 */
export function startSyncScheduler(intervalMinutes?: number) {
  const scheduler = getSyncScheduler();
  scheduler.start(intervalMinutes);
}

/**
 * Stop the global sync scheduler
 */
export function stopSyncScheduler() {
  if (globalScheduler) {
    globalScheduler.stop();
  }
}
