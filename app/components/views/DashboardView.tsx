"use client"
import React, {useState} from "react";
import {Sidebar} from "@/app/components/Sidebar";
import {Header} from "@/app/components/Header";
import {ProfileView} from "@/app/components/views/ProfileView";
import {OrganizationsView} from "@/app/components/views/OrganizationsView";
import {ProjectsView} from "@/app/components/views/ProjectsView";
import {WorkflowsView} from "@/app/components/views/WorkflowsView";

interface DashboardViewProps {
    user: {
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

interface Organization {
    id: string;
    name: string;
    [key: string]: unknown;
}

interface Project {
    id: string;
    name: string;
    [key: string]: unknown;
}

export const DashboardView = ({ user }: DashboardViewProps) => {
    const [activeSection, setActiveSection] = useState('organizations');
    const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
    const [selectedProject, setSelectedProject] = useState<Project | null>(null);
    const [currentView, setCurrentView] = useState('organizations'); // organizations, projects, workflows

    const handleSelectOrg = (org: Organization) => {
        setSelectedOrg(org);
        setCurrentView('projects');
    };

    const handleSelectProject = (project: Project) => {
        setSelectedProject(project);
        setCurrentView('workflows');
    };

    const handleBack = (target: string) => {
        if (target === 'organizations') {
            setSelectedOrg(null);
            setSelectedProject(null);
            setCurrentView('organizations');
        } else if (target === 'projects') {
            setSelectedProject(null);
            setCurrentView('projects');
        }
    };

    const handleSectionChange = (section: string) => {
        setActiveSection(section);
        if (section === 'organizations') {
            setCurrentView('organizations');
            setSelectedOrg(null);
            setSelectedProject(null);
        }
    };

    const handleProfileClick = () => {
        setActiveSection('profile');
    };

    const renderContent = () => {
        if (activeSection === 'profile') {
            return <ProfileView user={user} />;
        }

        // Handle the drill-down views for organizations
        switch (currentView) {
            case 'organizations':
                return <OrganizationsView onSelectOrg={handleSelectOrg} user={user} />;
            case 'projects':
                if (!selectedOrg) {
                    return <OrganizationsView onSelectOrg={handleSelectOrg} user={user} />;
                }
                return (
                    <ProjectsView
                        selectedOrg={selectedOrg}
                        onSelectProject={handleSelectProject}
                        onBack={() => handleBack('organizations')}
                        user={user}
                    />
                );
            case 'workflows':
                if (!selectedProject || !selectedOrg) {
                    return <OrganizationsView onSelectOrg={handleSelectOrg} user={user} />;
                }
                return (
                    <WorkflowsView
                        selectedProject={selectedProject}
                        selectedOrg={selectedOrg}
                        onBack={handleBack}
                        user={user}
                    />
                );
            default:
                return <OrganizationsView onSelectOrg={handleSelectOrg} user={user} />;
        }
    };

    const getPageTitle = () => {
        if (activeSection === 'profile') return 'Profile';
        switch (currentView) {
            case 'organizations': return 'Organizations';
            case 'projects': return selectedOrg ? `${selectedOrg.name} - Projects` : 'Projects';
            case 'workflows': return selectedProject ? `${selectedProject.name} - Workflows` : 'Workflows';
            default: return 'Dashboard';
        }
    };

    const getBreadcrumb = () => {
        if (activeSection === 'profile') return undefined;
        if (currentView === 'projects' && selectedOrg) return 'Organizations';
        if (currentView === 'workflows' && selectedProject && selectedOrg) return `${selectedOrg.name} - Projects`;
        return undefined;
    };

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar
                activeSection={activeSection}
                setActiveSection={handleSectionChange}
            />
            <div className="flex-1 overflow-hidden flex flex-col">
                <Header 
                    title={getPageTitle()}
                    breadcrumb={getBreadcrumb()}
                    user={user}
                    onProfileClick={handleProfileClick}
                />
                <div className="flex-1 overflow-auto">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};
