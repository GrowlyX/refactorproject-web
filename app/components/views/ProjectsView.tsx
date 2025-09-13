import {ArrowLeft, Clock, ExternalLink, FolderOpen, GitBranch, MoreHorizontal, Search} from "lucide-react";
import React from "react";
import {Header} from "@/app/components/Header";

export const ProjectsView = ({ selectedOrg, onSelectProject, onBack }) => {
    // Mock data based on your schema - projects linked to GitHub repositories
    const projects = [
        {
            id: 1,
            organizationId: selectedOrg.id,
            githubRepositoryId: 445566,
            name: 'ecommerce-platform',
            displayName: 'E-commerce Platform',
            description: 'Main customer-facing web application with shopping cart and payment processing',
            language: 'TypeScript',
            stars: 125,
            forks: 45,
            workflows: 12,
            lastPush: '2025-09-13T08:30:00Z',
            moduleInterlinks: {
                nodes: [
                    { id: 'auth', name: 'Authentication', type: 'module' },
                    { id: 'cart', name: 'Shopping Cart', type: 'module' },
                    { id: 'payment', name: 'Payment Processing', type: 'module' }
                ],
                links: [
                    { source: 'auth', target: 'cart', type: 'dependency' },
                    { source: 'cart', target: 'payment', type: 'dependency' }
                ]
            }
        },
        {
            id: 2,
            organizationId: selectedOrg.id,
            githubRepositoryId: 778899,
            name: 'mobile-app',
            displayName: 'Mobile App',
            description: 'iOS and Android mobile application for customer engagement',
            language: 'React Native',
            stars: 89,
            forks: 23,
            workflows: 6,
            lastPush: '2025-09-12T16:45:00Z',
            moduleInterlinks: {
                nodes: [
                    { id: 'ui', name: 'UI Components', type: 'module' },
                    { id: 'api', name: 'API Client', type: 'module' }
                ],
                links: [
                    { source: 'ui', target: 'api', type: 'dependency' }
                ]
            }
        },
        {
            id: 3,
            organizationId: selectedOrg.id,
            githubRepositoryId: 101112,
            name: 'analytics-dashboard',
            displayName: 'Analytics Dashboard',
            description: 'Internal analytics and reporting dashboard for business insights',
            language: 'Python',
            stars: 67,
            forks: 12,
            workflows: 4,
            lastPush: '2025-09-13T11:20:00Z',
            moduleInterlinks: {
                nodes: [
                    { id: 'data', name: 'Data Processing', type: 'module' },
                    { id: 'viz', name: 'Visualization', type: 'module' }
                ],
                links: [
                    { source: 'data', target: 'viz', type: 'dependency' }
                ]
            }
        }
    ];

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
                    <button className="bg-[#8661C1] text-white px-4 py-2 rounded-md hover:bg-[#7550A8] transition-colors">
                        Sync Repositories
                    </button>
                </div>
            </Header>

            <div className="p-6">
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
                                                <h3 className="text-lg font-semibold text-gray-900">{project.displayName}</h3>
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {project.language}
                        </span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span>{project.name}</span>
                                                <ExternalLink size={12} />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 mb-4">{project.description}</p>
                                    <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <GitBranch size={14} />
                        {project.workflows} workflows
                    </span>
                                        <span>⭐ {project.stars}</span>
                                        <span>🍴 {project.forks}</span>
                                        <span className="flex items-center gap-1">
                      <Clock size={14} />
                      Updated {formatTimeAgo(project.lastPush)}
                    </span>
                                    </div>
                                    {project.moduleInterlinks && project.moduleInterlinks.nodes.length > 0 && (
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
            </div>
        </div>
    );
};
