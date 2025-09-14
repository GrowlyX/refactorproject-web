import {CheckCircle, Clock, GitBranch, MoreHorizontal, Pause, Search, XCircle, RefreshCw, AlertCircle} from "lucide-react";
import React, {useState, useEffect, useCallback} from "react";
import { Workflow } from "@/lib/types/workflow";

interface WorkflowsViewProps {
    selectedProject: { id: string; name: string; [key: string]: unknown };
    selectedOrg: { id: string; name: string; [key: string]: unknown };
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
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load workflows on component mount
    useEffect(() => {
        loadWorkflows();
    }, [selectedProject.id, loadWorkflows]);

    const loadWorkflows = useCallback(async () => {
        setLoading(true);
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
    }, [selectedProject.id]);

    const handleRefresh = async () => {
        setRefreshing(true);
        await loadWorkflows();
        setRefreshing(false);
    };

    const handleTriggerWorkflow = async () => {
        setRefreshing(true);
        setError(null);

        try {
            const response = await fetch(`/api/projects/${selectedProject.id}/workflows/trigger`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                await loadWorkflows(); // Reload workflows after successful trigger
            } else {
                setError(data.error || 'Failed to trigger workflow');
            }
        } catch (err) {
            setError('Failed to trigger workflow');
            console.error('Error triggering workflow:', err);
        } finally {
            setRefreshing(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle size={16} className="text-green-500" />;
            case 'running':
                return <RefreshCw size={16} className="text-blue-500 animate-spin" />;
            case 'failed':
                return <XCircle size={16} className="text-red-500" />;
            case 'paused':
                return <Pause size={16} className="text-yellow-500" />;
            default:
                return <Clock size={16} className="text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800';
            case 'running':
                return 'bg-blue-100 text-blue-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'paused':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const hours = Math.floor(diffInMinutes / 60);
        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                        <button
                            onClick={() => onBack('organizations')}
                            className="text-purple-600 hover:text-purple-700 transition-colors"
                        >
                            {selectedOrg.displayName}
                        </button>
                        <span className="mx-1">/</span>
                        <button
                            onClick={() => onBack('projects')}
                            className="text-purple-600 hover:text-purple-700 transition-colors"
                        >
                            {selectedProject.displayName}
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search workflows"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent">
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
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
                >
                    Trigger Workflow
                </button>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-600" />
                        <span className="text-red-800">{error}</span>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-purple-500" size={32} />
                    <span className="ml-2 text-gray-600">Loading workflows...</span>
                </div>
            ) : workflows.length === 0 ? (
                <div className="text-center py-12">
                    <GitBranch size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows found</h3>
                    <p className="text-gray-500 mb-4">Trigger a workflow to get started with refactoring</p>
                    <button
                        onClick={handleTriggerWorkflow}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                        Trigger Workflow
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {workflows.map((workflow) => (
                        <div
                            key={workflow.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <GitBranch size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>Workflow #{workflow.runNumber}</span>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
                                                    {workflow.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            {getStatusIcon(workflow.status)}
                                            {workflow.status}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            Started {formatDate(workflow.startedAt)}
                                        </span>
                                        {workflow.conclusion && (
                                            <span className="flex items-center gap-1">
                                                <CheckCircle size={14} />
                                                Completed {formatDate(workflow.completedAt)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => {
                                            // Handle view details
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="View details"
                                    >
                                        <MoreHorizontal size={20} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};