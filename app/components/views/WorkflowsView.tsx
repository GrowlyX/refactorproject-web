import {CheckCircle, Clock, GitBranch, MoreHorizontal, Pause, Search, XCircle} from "lucide-react";
import React from "react";
import {Header} from "@/app/components/Header";

export const WorkflowsView = ({ selectedProject, selectedOrg, onBack }) => {
    // Mock data based on your schema
    const workflows = [
        {
            id: 1,
            projectId: selectedProject.id,
            state: 'in_progress',
            results: {
                totalSteps: 5,
                completedSteps: 3,
                currentStep: 'Building Docker image',
                logs: ['Started workflow', 'Checked out code', 'Building...']
            },
            createdAt: '2025-09-13T08:25:00Z',
            updatedAt: '2025-09-13T08:30:00Z'
        },
        {
            id: 2,
            projectId: selectedProject.id,
            state: 'complete',
            results: {
                totalSteps: 4,
                completedSteps: 4,
                duration: '2m 34s',
                status: 'success',
                deploymentUrl: 'https://app.example.com'
            },
            createdAt: '2025-09-13T06:15:00Z',
            updatedAt: '2025-09-13T06:18:00Z'
        },
        {
            id: 3,
            projectId: selectedProject.id,
            state: 'scheduling',
            results: null,
            createdAt: '2025-09-13T08:35:00Z',
            updatedAt: '2025-09-13T08:35:00Z'
        },
        {
            id: 4,
            projectId: selectedProject.id,
            state: 'complete',
            results: {
                totalSteps: 3,
                completedSteps: 2,
                duration: '1m 12s',
                status: 'failed',
                error: 'Build failed: Module not found'
            },
            createdAt: '2025-09-12T14:20:00Z',
            updatedAt: '2025-09-12T14:22:00Z'
        }
    ];

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
                    </div>
                    <button className="bg-[#8661C1] text-white px-4 py-2 rounded-md hover:bg-[#7550A8] transition-colors">
                        Trigger Workflow
                    </button>
                </div>
            </Header>

            <div className="p-6">
                <div className="bg-white rounded-lg border border-gray-200">
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
                    </div>
                </div>
            </div>
        </div>
    );
};
