import {Calendar, ExternalLink, Filter, FolderOpen, Github, MoreHorizontal, Search, Users, Plus, X, AlertCircle, CheckCircle, Loader} from "lucide-react";
import React, { useState, useEffect } from "react";
import {Header} from "@/app/components/Header";

export const OrganizationsView = ({ onSelectOrg }) => {
    const [showCreatePrompt, setShowCreatePrompt] = useState(false);
    const [orgName, setOrgName] = useState('');
    const [creationStep, setCreationStep] = useState('input'); // 'input', 'pending', 'success', 'error'
    const [errorMessage, setErrorMessage] = useState('');
    const [isPolling, setIsPolling] = useState(false);

    // Mock data based on your schema - organizations from GitHub
    const organizations = [
        {
            id: 1,
            githubId: 12345,
            name: 'acme-corp',
            displayName: 'Acme Corporation',
            projects: 12,
            members: 45,
            createdAt: '2025-09-10T10:00:00Z'
        },
        {
            id: 2,
            githubId: 67890,
            name: 'techstart-inc',
            displayName: 'TechStart Inc',
            projects: 8,
            members: 23,
            createdAt: '2025-09-12T14:30:00Z'
        },
        {
            id: 3,
            githubId: 11223,
            name: 'global-solutions',
            displayName: 'Global Solutions',
            projects: 15,
            members: 67,
            createdAt: '2025-09-08T09:15:00Z'
        }
    ];

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const handleCreateOrganization = async () => {
        if (!orgName.trim()) {
            setErrorMessage('Please enter an organization name');
            return;
        }

        setCreationStep('pending');
        setErrorMessage('');

        try {
            // Check if organization already exists and current user has access
            const response = await fetch(`/api/organizations/check/${encodeURIComponent(orgName)}`);
            const { exists, hasAccess } = await response.json();

            if (exists && hasAccess) {
                setErrorMessage('You already have access to this organization');
                setCreationStep('error');
                return;
            }

            if (exists && !hasAccess) {
                setErrorMessage('Organization exists but you don\'t have access. Please add the GitHub App to the organization first.');
                setCreationStep('error');
                return;
            }

            // Start polling for the organization
            startPolling();

        } catch (error) {
            console.error('Error checking organization:', error);
            setErrorMessage('Failed to check organization. Please try again.');
            setCreationStep('error');
        }
    };

    const startPolling = () => {
        setIsPolling(true);
        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch('/api/organizations/poll', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ orgName: orgName.trim() })
                });

                const result = await response.json();

                if (result.success) {
                    setCreationStep('success');
                    setIsPolling(false);
                    clearInterval(pollInterval);

                    // Refresh the organizations list
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                } else if (result.error) {
                    setErrorMessage(result.error);
                    setCreationStep('error');
                    setIsPolling(false);
                    clearInterval(pollInterval);
                }
            } catch (error) {
                console.error('Polling error:', error);
                setErrorMessage('Failed to check organization status');
                setCreationStep('error');
                setIsPolling(false);
                clearInterval(pollInterval);
            }
        }, 3000); // Poll every 3 seconds

        // Stop polling after 2 minutes
        setTimeout(() => {
            if (isPolling) {
                clearInterval(pollInterval);
                setIsPolling(false);
                setErrorMessage('Timeout waiting for GitHub App installation. Please try again.');
                setCreationStep('error');
            }
        }, 120000);
    };

    const resetPrompt = () => {
        setShowCreatePrompt(false);
        setOrgName('');
        setCreationStep('input');
        setErrorMessage('');
        setIsPolling(false);
    };

    const openGitHubAppInstall = () => {
        // Replace with your actual GitHub App installation URL
        const githubAppUrl = `https://github.com/apps/your-app-name/installations/new`;
        window.open(githubAppUrl, '_blank');
    };

    return (
        <div>
            <Header title="Organizations">
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search organizations"
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                            />
                        </div>
                        <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                            <Filter size={16} />
                            Filter
                        </button>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowCreatePrompt(true)}
                            className="flex items-center gap-2 bg-[#8661C1] text-white px-4 py-2 rounded-md hover:bg-[#7550A8] transition-colors"
                        >
                            <Plus size={16} />
                            Add Organization
                        </button>
                        <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 transition-colors">
                            Sync GitHub Orgs
                        </button>
                    </div>
                </div>
            </Header>

            <div className="p-6">
                <div className="grid gap-4">
                    {organizations.map((org) => (
                        <div
                            key={org.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-[#8661C1]"
                            onClick={() => onSelectOrg(org)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-[#EFBCD5] rounded-lg flex items-center justify-center">
                                            <Github size={24} className="text-[#8661C1]" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{org.displayName}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>@{org.name}</span>
                                                <ExternalLink size={12} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <FolderOpen size={14} />
                                            {org.projects} repositories
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={14} />
                                            {org.members} members
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            Created {formatDate(org.createdAt)}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        // Handle menu actions
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <MoreHorizontal size={20} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create Organization Modal */}
            {showCreatePrompt && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg max-w-md w-full p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Add GitHub Organization</h2>
                            <button
                                onClick={resetPrompt}
                                className="text-gray-400 hover:text-gray-600"
                                disabled={isPolling}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {creationStep === 'input' && (
                            <>
                                <div className="mb-4">
                                    <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-2">
                                        GitHub Organization Name
                                    </label>
                                    <input
                                        id="orgName"
                                        type="text"
                                        value={orgName}
                                        onChange={(e) => setOrgName(e.target.value)}
                                        placeholder="my-organization"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                                        onKeyPress={(e) => e.key === 'Enter' && handleCreateOrganization()}
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Enter the exact name of your GitHub organization
                                    </p>
                                </div>

                                {errorMessage && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-center gap-2 text-red-700">
                                            <AlertCircle size={16} />
                                            <span className="text-sm">{errorMessage}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={handleCreateOrganization}
                                        className="flex-1 bg-[#8661C1] text-white py-2 px-4 rounded-md hover:bg-[#7550A8] transition-colors"
                                        disabled={!orgName.trim()}
                                    >
                                        Continue
                                    </button>
                                    <button
                                        onClick={resetPrompt}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </>
                        )}

                        {creationStep === 'pending' && (
                            <div className="text-center py-8">
                                <div className="mb-4">
                                    <Loader className="animate-spin mx-auto text-[#8661C1]" size={32} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Waiting for GitHub App Installation
                                </h3>
                                <p className="text-gray-600 mb-6">
                                    Please install our GitHub App to the <strong>{orgName}</strong> organization to continue.
                                </p>

                                <button
                                    onClick={openGitHubAppInstall}
                                    className="bg-green-600 text-white py-2 px-6 rounded-md hover:bg-green-700 transition-colors inline-flex items-center gap-2 mb-4"
                                >
                                    <Github size={16} />
                                    Add App to Organization
                                </button>

                                <div className="text-xs text-gray-500">
                                    <p>We'll automatically detect when the app is installed.</p>
                                    <p>This may take a few moments...</p>
                                </div>

                                {errorMessage && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                        <div className="flex items-center gap-2 text-red-700">
                                            <AlertCircle size={16} />
                                            <span className="text-sm">{errorMessage}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {creationStep === 'success' && (
                            <div className="text-center py-8">
                                <div className="mb-4">
                                    <CheckCircle className="mx-auto text-green-600" size={48} />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    Organization Added Successfully!
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    <strong>{orgName}</strong> has been added to your account.
                                </p>
                                <p className="text-sm text-gray-500">
                                    Refreshing the page...
                                </p>
                            </div>
                        )}

                        {creationStep === 'error' && (
                            <div className="py-4">
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <div className="flex items-center gap-2 text-red-700">
                                        <AlertCircle size={16} />
                                        <span className="text-sm">{errorMessage}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setCreationStep('input');
                                            setErrorMessage('');
                                        }}
                                        className="flex-1 bg-[#8661C1] text-white py-2 px-4 rounded-md hover:bg-[#7550A8] transition-colors"
                                    >
                                        Try Again
                                    </button>
                                    <button
                                        onClick={resetPrompt}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
