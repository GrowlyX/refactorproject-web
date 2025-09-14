import {CheckCircle, Clock, GitBranch, MoreHorizontal, Pause, Search, XCircle, RefreshCw, AlertCircle} from "lucide-react";
import React, {useState, useEffect} from "react";
import {Header} from "@/app/components/Header";
import { Workflow } from "@/lib/types/workflow";

interface WorkflowsViewProps {
    selectedProject: any;
    selectedOrg: any;
    onBack: (target: string) => void;
    user?: {
        object: 'user';
        id: string;
        email: string;
        emailVerified: boolean;
        profilePictureUrl: string | null;
        firstName: string | null;
        lastName: string | null;
        lastSignInAt: string | null;
        createdAt: string;
        updatedAt: string;
    };
}

export const WorkflowsView = ({ selectedProject, selectedOrg, onBack, user }: WorkflowsViewProps) => {
    const [workflows, setWorkflows] = useState<Workflow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);

    // Load workflows on component mount
    useEffect(() => {
        loadWorkflows();
    }, [selectedProject.id]);

    const loadWorkflows = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`/api/projects/${selectedProject.id}/workflows`);
            const data = await response.json();
            
            if (data.success) {
                setWorkflows(data.workflows);
            } else {
                setError(data.error || 'Failed to load workflows');
            }
        } catch (err) {
            setError('Failed to load workflows');
            console.error('Error loading workflows:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        setError(null);
        try {
            const response = await fetch(`/api/projects/${selectedProject.id}/workflows`);
            const data = await response.json();
            
            if (data.success) {
                setWorkflows(data.workflows);
            } else {
                setError(data.error || 'Failed to refresh workflows');
            }
        } catch (err) {
            setError('Failed to refresh workflows');
            console.error('Error refreshing workflows:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const handleTriggerWorkflow = async () => {
        try {
            const response = await fetch(`/api/projects/${selectedProject.id}/workflows`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    state: 'scheduling',
                    results: null
                }),
            });

            const data = await response.json();

            if (data.success) {
                await loadWorkflows(); // Reload workflows after creating new one
            } else {
                setError(data.error || 'Failed to trigger workflow');
            }
        } catch (err) {
            setError('Failed to trigger workflow');
            console.error('Trigger workflow error:', err);
        }
    };

    const handleSeedSampleData = async () => {
        try {
            const response = await fetch('/api/dev/seed-workflows', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                await loadWorkflows(); // Reload workflows after seeding
            } else {
                setError(data.error || 'Failed to seed sample data');
            }
        } catch (err) {
            setError('Failed to seed sample data');
            console.error('Seed sample data error:', err);
        }
    };

    const getStatusIcon = (state, results) => {
        if (state === 'in_progress') {
            return <Clock size={16} className="text-blue-600" />;
        }
        if (state === 'scheduling') {
            return <Pause size={16} className="text-yellow-600" />;
        }
        if (state === 'complete') {
            if (results?.status === 'success') {
                return <CheckCircle size={16} className="text-green-600" />;
            } else {
                return <XCircle size={16} className="text-red-600" />;
            }
        }
        return <Clock size={16} className="text-gray-600" />;
    };

    const getStatusText = (state, results) => {
        if (state === 'in_progress') return 'In Progress';
        if (state === 'scheduling') return 'Scheduled';
        if (state === 'complete') {
            return results?.status === 'success' ? 'Completed' : 'Failed';
        }
        return 'Unknown';
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const minutes = Math.floor((now - date) / (1000 * 60));

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div>
            <Header
                title={`Workflows in ${selectedProject.displayName}`}
                user={user}
                breadcrumb={
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <button
                            onClick={() => onBack('organizations')}
                            className="text-[#8661C1] hover:text-[#7550A8] transition-colors"
                        >
                            {selectedOrg.displayName}
                        </button>
                        <span className="mx-1">/</span>
                        <button
                            onClick={() => onBack('projects')}
                            className="text-[#8661C1] hover:text-[#7550A8] transition-colors"
                        >
                            {selectedProject.displayName}
                        </button>
                    </div>
                }
            >
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search workflows"
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                            />
                        </div>
                        <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent">
                            <option>All States</option>
                            <option>Scheduling</option>
                            <option>In Progress</option>
                            <option>Complete</option>
                        </select>
                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                    <button 
                        onClick={handleTriggerWorkflow}
                        className="bg-[#8661C1] text-white px-4 py-2 rounded-md hover:bg-[#7550A8] transition-colors"
                    >
                        Trigger Workflow
                    </button>
                </div>
            </Header>

            <div className="p-6">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center gap-2">
                            <AlertCircle size={16} className="text-red-600" />
                            <span className="text-red-800">{error}</span>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200">
                    {loading ? (
                        <div className="p-8 text-center">
                            <div className="inline-flex items-center gap-2 text-gray-600">
                                <RefreshCw size={20} className="animate-spin" />
                                Loading workflows...
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Workflow
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    State
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Progress
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Duration
                                </th>
                                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="w-10"></th>
                            </tr>
                            </thead>
                            <tbody className="bg-white">
                            {workflows.map((workflow) => (
                                <tr key={workflow.id} className="border-b border-gray-100 hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-[#EFBCD5] rounded-lg flex items-center justify-center">
                                                <GitBranch size={14} className="text-[#8661C1]" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-gray-900">Workflow #{workflow.id}</div>
                                                <div className="text-sm text-gray-500">
                                                    {workflow.results?.currentStep ||
                                                        workflow.results?.error?.split(':')[0] ||
                                                        'Automated workflow execution'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(workflow.state, workflow.results)}
                                            <span className={`text-sm font-medium ${
                                                workflow.state === 'in_progress'
                                                    ? 'text-blue-800'
                                                    : workflow.state === 'scheduling'
                                                        ? 'text-yellow-800'
                                                        : workflow.results?.status === 'success'
                                                            ? 'text-green-800'
                                                            : 'text-red-800'
                                            }`}>
                          {getStatusText(workflow.state, workflow.results)}
                        </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {workflow.results?.totalSteps ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full ${
                                                            workflow.results?.status === 'success' ? 'bg-green-500' :
                                                                workflow.results?.status === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                                                        }`}
                                                        style={{
                                                            width: `${(workflow.results.completedSteps / workflow.results.totalSteps) * 100}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <span className="text-sm text-gray-900">
                            {workflow.results.completedSteps}/{workflow.results.totalSteps}
                          </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-500">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {workflow.results?.duration || '—'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500">
                                        {formatTimeAgo(workflow.createdAt)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button className="text-gray-400 hover:text-gray-600">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        )}
                    </div>
                )}
                
                {!loading && workflows.length === 0 && !error && (
                    <div className="p-8 text-center text-gray-500">
                        <GitBranch size={48} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
                        <p className="mb-4">Get started by triggering your first workflow for this project.</p>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={handleTriggerWorkflow}
                                className="bg-[#8661C1] text-white px-4 py-2 rounded-md hover:bg-[#7550A8] transition-colors"
                            >
                                Trigger First Workflow
                            </button>
                            {process.env.NODE_ENV === 'development' && (
                                <button 
                                    onClick={handleSeedSampleData}
                                    className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                                >
                                    Seed Sample Data
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
