export type WorkflowState = 'scheduling' | 'in_progress' | 'complete';

export interface WorkflowResults {
  totalSteps?: number;
  completedSteps?: number;
  currentStep?: string;
  duration?: string;
  status?: 'success' | 'failed';
  deploymentUrl?: string;
  error?: string;
  logs?: string[];
}

export interface Workflow {
  id: number;
  projectId: number;
  state: WorkflowState;
  results: WorkflowResults | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowRequest {
  state?: WorkflowState;
  results?: WorkflowResults;
}

export interface UpdateWorkflowRequest {
  state?: WorkflowState;
  results?: WorkflowResults;
}
