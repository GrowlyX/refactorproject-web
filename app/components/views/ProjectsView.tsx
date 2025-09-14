import {ArrowLeft, Clock, ExternalLink, FolderOpen, GitBranch, MoreHorizontal, Search, RefreshCw, AlertCircle} from "lucide-react";
import React, {useState, useEffect, useCallback} from "react";

interface ProjectsViewProps {
    selectedOrg: { id: string; name: string; [key: string]: unknown };
    onSelectProject: (project: { id: string; name: string; [key: string]: unknown }) => void;
    onBack: () => void;
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

export const ProjectsView = ({ selectedOrg, onSelectProject, onBack, user }: ProjectsViewProps) => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState(null);

    const loadProjects = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`/api/organizations/${selectedOrg.id}/projects`);
            const data = await response.json();

            if (data.success) {
                setProjects(data.projects);
            } else {
                setError(data.error || 'Failed to load projects');
            }
        } catch (err) {
            setError('Failed to load projects');
            console.error('Error loading projects:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedOrg.id]);

    // Load projects on component mount
    useEffect(() => {
        loadProjects();
    }, [selectedOrg.id, loadProjects]);
    const handleSyncRepositories = async () => {
        setSyncing(true);
        setError(null);

        try {
            const response = await fetch(`/api/github/sync/repositories/${selectedOrg.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                await loadProjects(); // Reload projects after successful sync
            } else {
                setError(data.error || 'Failed to sync repositories');
            }
        } catch (err) {
            setError('Failed to sync repositories');
            console.error('Error syncing repositories:', err);
        } finally {
            setSyncing(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMinutes / 60);

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return `${diffInHours}h ago`;
        return `${Math.floor(diffInHours / 24)}d ago`;
    };

    return (
        <div className="p-6">
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Organizations
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search repositories"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>
                    <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                        <option>All Languages</option>
                        <option>TypeScript</option>
                        <option>JavaScript</option>
                        <option>Python</option>
                        <option>React Native</option>
                    </select>
                </div>
                <button
                    onClick={handleSyncRepositories}
                    disabled={syncing}
                    className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {syncing ? (
                        <RefreshCw className="animate-spin" size={16} />
                    ) : (
                        <RefreshCw size={16} />
                    )}
                    {syncing ? 'Syncing...' : 'Sync Repositories'}
                </button>
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
                    <span className="ml-2 text-gray-600">Loading repositories...</span>
                </div>
            ) : projects.length === 0 ? (
                <div className="text-center py-12">
                    <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No repositories found</h3>
                    <p className="text-gray-500 mb-4">Sync repositories from GitHub to get started</p>
                    <button
                        onClick={handleSyncRepositories}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-md hover:from-purple-600 hover:to-pink-600 transition-colors"
                    >
                        Sync Repositories
                    </button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-purple-500"
                            onClick={() => onSelectProject(project)}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                            <FolderOpen size={24} className="text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{project.fullName}</span>
                                                <ExternalLink size={12} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm text-gray-600">
                                        <span className="flex items-center gap-1">
                                            <GitBranch size={14} />
                                            {project.defaultBranch || 'main'}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} />
                                            Updated {formatDate(project.updatedAt)}
                                        </span>
                                        <span className="flex items-center gap-1">
                                            <span className={`w-2 h-2 rounded-full ${project.private ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                            {project.private ? 'Private' : 'Public'}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // Handle sync action
                                        }}
                                        className="text-gray-400 hover:text-gray-600"
                                        title="Sync repository"
                                    >
                                        <RefreshCw size={16} />
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
        </div>
    );
};
