"use client";
import {Calendar, ExternalLink, Filter, FolderOpen, Github, MoreHorizontal, Search, Users, RefreshCw, AlertCircle} from "lucide-react";
import React, {useState, useEffect} from "react";

interface OrganizationsViewProps {
    onSelectOrg: (org: { id: string; name: string; [key: string]: unknown }) => void;
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

export const OrganizationsView = ({ onSelectOrg, user }: OrganizationsViewProps) => {
    const [organizations, setOrganizations] = useState<Array<{ id: string; name: string; [key: string]: unknown }>>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [githubConnected, setGithubConnected] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);
    const [installationUrl, setInstallationUrl] = useState('');

    // Load organizations on component mount
    useEffect(() => {
        loadOrganizations();
        
        // Check for GitHub connection status from URL params
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('github_connected') === 'true') {
            setGithubConnected(true);
            loadOrganizations(); // Reload organizations after successful connection
        } else if (urlParams.get('github_error') === 'true') {
            setError('Failed to connect to GitHub. Please try again.');
        }
    }, []);

    const loadOrganizations = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/organizations');
            const data = await response.json();
            
            if (data.success) {
                setOrganizations(data.organizations);
            } else {
                setError(data.error || 'Failed to load organizations');
            }
        } catch (err) {
            setError('Failed to load organizations');
            console.error('Error loading organizations:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInstallGitHubApp = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/github/install');
            const data = await response.json();

            if (data.success) {
                setInstallationUrl(data.installationUrl);
                setShowInstallModal(true);
            } else {
                setError(data.error || 'Failed to get installation URL');
            }
        } catch (err) {
            setError('Failed to get installation URL');
            console.error('GitHub install error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleConnectGitHub = async () => {
        setSyncing(true);
        setError(null);

        try {
            const response = await fetch('/api/github/connect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setGithubConnected(true);
                setShowInstallModal(false);
                await loadOrganizations(); // Reload organizations after connection
            } else {
                setError(data.error || 'Failed to connect to GitHub');
            }
        } catch (err) {
            setError('Failed to connect to GitHub');
            console.error('GitHub connection error:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleSyncOrganizations = async () => {
        if (!githubConnected) {
            await handleInstallGitHubApp();
            return;
        }

        setSyncing(true);
        setError(null);

        try {
            const response = await fetch('/api/github/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                await loadOrganizations(); // Reload organizations after sync
            } else {
                setError(data.error || 'Failed to sync organizations');
            }
        } catch (err) {
            setError('Failed to sync organizations');
            console.error('Sync error:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleSyncOrganization = async (orgId: number) => {
        setSyncing(true);
        setError(null);

        try {
            const response = await fetch(`/api/github/sync/organization/${orgId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                await loadOrganizations(); // Reload organizations after successful sync
            } else {
                setError(data.error || 'Failed to sync organization');
            }
        } catch (err) {
            setError('Failed to sync organization');
            console.error('Error syncing organization:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleSyncMembers = async (orgId: number) => {
        setSyncing(true);
        setError(null);

        try {
            const response = await fetch(`/api/github/sync/members/${orgId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                await loadOrganizations(); // Reload organizations after successful sync
            } else {
                setError(data.error || 'Failed to sync members');
            }
        } catch (err) {
            setError('Failed to sync members');
            console.error('Error syncing members:', err);
        } finally {
            setSyncing(false);
        }
    };

    const handleBackgroundSync = async () => {
        setSyncing(true);
        setError(null);

        try {
            const response = await fetch('/api/github/sync/background', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                await loadOrganizations(); // Reload organizations after successful sync
            } else {
                setError(data.error || 'Failed to run background sync');
            }
        } catch (err) {
            setError('Failed to run background sync');
            console.error('Error running background sync:', err);
        } finally {
            setSyncing(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search organizations"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50">
                        <Filter size={16} />
                        Filter
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    {githubConnected && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            GitHub Connected
                        </div>
                    )}
                    <button 
                        onClick={handleBackgroundSync}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {syncing ? (
                            <RefreshCw className="animate-spin" size={16} />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {syncing ? 'Syncing...' : 'Background Sync'}
                    </button>
                    <button 
                        onClick={handleSyncOrganizations}
                        disabled={syncing}
                        className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {syncing ? (
                            <RefreshCw className="animate-spin" size={16} />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {syncing ? 'Syncing...' : 'Sync GitHub Orgs'}
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <RefreshCw className="animate-spin text-purple-500" size={32} />
                    <span className="ml-2 text-gray-600">Loading organizations...</span>
                </div>
            ) : organizations.length === 0 ? (
                <div className="text-center py-12">
                    <Github size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations found</h3>
                    <p className="text-gray-500 mb-4">Install our GitHub App to sync your organizations</p>
                    <button
                        onClick={handleInstallGitHubApp}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                        Install GitHub App
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {organizations.map((org) => (
                        <div
                            key={org.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-purple-500"
                            onClick={() => onSelectOrg(org)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <Github size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>@{org.name}</span>
                                                <ExternalLink size={12} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <FolderOpen size={14} />
                                            {(org.projectCount as number) || 0} repositories
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Users size={14} />
                                            {(org.memberCount as number) || 0} members
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Calendar size={14} />
                                            Joined {formatDate(org.joinedAt as string)}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSyncOrganization(parseInt(org.id));
                                        }}
                                        disabled={syncing}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        title="Sync organization"
                                    >
                                        <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSyncMembers(parseInt(org.id));
                                        }}
                                        disabled={syncing}
                                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                        title="Sync members"
                                    >
                                        <Users size={16} />
                                    </button>
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
                        </div>
                    ))}
                </div>
            )}

            {/* GitHub App Installation Modal */}
            {showInstallModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Install GitHub App</h3>
                        <p className="text-gray-600 mb-4">
                            Install our GitHub App on your organization to sync repositories and members.
                        </p>
                        <div className="mb-4">
                            <p className="text-sm text-gray-500 mb-2">
                                Click the button below to install the app on your GitHub organization:
                            </p>
                            <a
                                href={installationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-[#24292e] text-white px-4 py-2 rounded-md hover:bg-[#1a1e22] transition-colors"
                            >
                                <Github size={16} />
                                Install on GitHub
                            </a>
                        </div>
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-700 mb-2">
                                <strong>Installation Process:</strong>
                            </p>
                            <ol className="text-sm text-blue-700 list-decimal list-inside space-y-1">
                                <li>Click &quot;Install on GitHub&quot; above</li>
                                <li>Select your organization and repositories</li>
                                <li>Complete the installation</li>
                                <li>You&apos;ll be redirected back here automatically</li>
                            </ol>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowInstallModal(false);
                                    setError(null);
                                }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConnectGitHub}
                                disabled={syncing}
                                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {syncing ? 'Connecting...' : 'Connect'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};