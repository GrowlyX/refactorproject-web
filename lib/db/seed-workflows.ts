import { db } from './drizzle';
import { workflows } from './schema';

// Sample workflow data for testing
const sampleWorkflows = [
  {
    projectId: 1, // Assuming project with ID 1 exists
    state: 'in_progress' as const,
    results: {
      totalSteps: 5,
      completedSteps: 3,
      currentStep: 'Building Docker image',
      logs: ['Started workflow', 'Checked out code', 'Building...']
    }
  },
  {
    projectId: 1,
    state: 'complete' as const,
    results: {
      totalSteps: 4,
      completedSteps: 4,
      duration: '2m 34s',
      status: 'success',
      deploymentUrl: 'https://app.example.com'
    }
  },
  {
    projectId: 1,
    state: 'scheduling' as const,
    results: null
  },
  {
    projectId: 1,
    state: 'complete' as const,
    results: {
      totalSteps: 3,
      completedSteps: 2,
      duration: '1m 12s',
      status: 'failed',
      error: 'Build failed: Module not found'
    }
  }
];

export async function seedWorkflows() {
  try {
    console.log('Seeding sample workflows...');
    
    for (const workflow of sampleWorkflows) {
      await db.insert(workflows).values(workflow);
    }
    
    console.log('✅ Sample workflows seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding workflows:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedWorkflows()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
