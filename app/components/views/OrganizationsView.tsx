import {Calendar, ExternalLink, Filter, FolderOpen, Github, MoreHorizontal, Search, Users} from "lucide-react";
import React from "react";
import {Header} from "@/app/components/Header";

export const OrganizationsView = ({ onSelectOrg }) => {
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
                    <button className="bg-[#8661C1] text-white px-4 py-2 rounded-md hover:bg-[#7550A8] transition-colors">
                        Sync GitHub Orgs
                    </button>
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
        </div>
    );
};
