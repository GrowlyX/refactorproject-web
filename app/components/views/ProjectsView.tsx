import {ArrowLeft, Clock, ExternalLink, FolderOpen, GitBranch, MoreHorizontal, Search, RefreshCw, AlertCircle} from "lucide-react";
import React, {useState, useEffect} from "react";
import {Header} from "@/app/components/Header";

interface ProjectsViewProps {
    selectedOrg: any;
    onSelectProject: (project: any) => void;
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

    // Load projects on component mount
    useEffect(() => {
        loadProjects();
    }, [selectedOrg.id]);

    const loadProjects = async () => {
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
    };

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
                await loadProjects(); // Reload projects after sync
            } else {
                setError(data.error || 'Failed to sync repositories');
            }
        } catch (err) {
            setError('Failed to sync repositories');
            console.error('Sync repositories error:', err);
        } finally {
            setSyncing(false);
        }
    };

    const formatTimeAgo = (dateString) => {
        const now = new Date();
        const date = new Date(dateString);
        const hours = Math.floor((now - date) / (1000 * 60 * 60));

        if (hours < 1) return 'Just now';
        if (hours < 24) return `${hours}h ago`;
        return `${Math.floor(hours / 24)}d ago`;
    };

    return (
        <div>
            <Header
                title={`Projects in ${selectedOrg.displayName}`}
                user={user}
                breadcrumb={
                    <button
                        onClick={onBack}
                        className="flex items-center gap-1 text-[#8661C1] hover:text-[#7550A8] transition-colors"
                    >
                        <ArrowLeft size={16} />
                        Back to Organizations
                    </button>
                }
            >
                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search repositories"
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                            />
                        </div>
                        <select className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent">
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
                        className="flex items-center gap-2 bg-[#8661C1] text-white px-4 py-2 rounded-md hover:bg-[#7550A8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {syncing ? (
                            <RefreshCw className="animate-spin" size={16} />
                        ) : (
                            <RefreshCw size={16} />
                        )}
                        {syncing ? 'Syncing...' : 'Sync Repositories'}
                    </button>
                </div>
            </Header>

            <div className="p-6">
                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-700">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <RefreshCw className="animate-spin text-[#8661C1]" size={32} />
                        <span className="ml-2 text-gray-600">Loading projects...</span>
                    </div>
                ) : projects.length === 0 ? (
                    <div className="text-center py-12">
                        <FolderOpen size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                        <p className="text-gray-500 mb-4">Sync repositories to see your projects</p>
                        <button
                            onClick={handleSyncRepositories}
                            disabled={syncing}
                            className="bg-[#8661C1] text-white px-6 py-2 rounded-md hover:bg-[#7550A8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {syncing ? 'Syncing...' : 'Sync Repositories'}
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {projects.map((project) => (
                            <div
                                key={project.id}
                                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer hover:border-[#8661C1]"
                                onClick={() => onSelectProject(project)}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="w-10 h-10 bg-[#EFBCD5] rounded-lg flex items-center justify-center">
                                                <FolderOpen size={20} className="text-[#8661C1]" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">{project.repositoryName}</h3>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                                        project.isPrivate 
                                                            ? 'bg-red-100 text-red-800' 
                                                            : 'bg-green-100 text-green-800'
                                                    }`}>
                                                        {project.isPrivate ? 'Private' : 'Public'}
                                                    </span>
                                                    {project.language && (
                                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                            {project.language}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500">
                                                    <span>{project.repositoryUrl ? (
                                                        <a 
                                                            href={project.repositoryUrl} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            className="flex items-center gap-1 hover:text-[#8661C1] transition-colors"
                                                        >
                                                            View on GitHub
                                                            <ExternalLink size={12} />
                                                        </a>
                                                    ) : (
                                                        `ID: ${project.githubRepositoryId}`
                                                    )}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {project.description && (
                                            <p className="text-gray-600 mb-4">{project.description}</p>
                                        )}
                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <GitBranch size={14} />
                                                {project.defaultBranch || 'main'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock size={14} />
                                                Updated {formatTimeAgo(project.updatedAt)}
                                            </span>
                                            {project.lastAnalyzedAt && (
                                                <span className="flex items-center gap-1">
                                                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                                    Analyzed {formatTimeAgo(project.lastAnalyzedAt)}
                                                </span>
                                            )}
                                            {project.stars !== undefined && (
                                                <span>⭐ {project.stars}</span>
                                            )}
                                            {project.forks !== undefined && (
                                                <span>🍴 {project.forks}</span>
                                            )}
                                        </div>
                                        {project.moduleInterlinks && project.moduleInterlinks.nodes && project.moduleInterlinks.nodes.length > 0 && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <span className="text-xs text-gray-500">Modules:</span>
                                                {project.moduleInterlinks.nodes.slice(0, 3).map((node, idx) => (
                                                    <span key={node.id} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                        {node.name}
                                                    </span>
                                                ))}
                                                {project.moduleInterlinks.nodes.length > 3 && (
                                                    <span className="text-xs text-gray-500">
                                                        +{project.moduleInterlinks.nodes.length - 3} more
                                                    </span>
                                                )}
                                            </div>
                                        )}
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
                )}
            </div>
        </div>
    );
};
