"use client"
import React, {useState} from "react";
import {Sidebar} from "@/app/components/Sidebar";
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

export const DashboardView = ({ user }: DashboardViewProps) => {
    const [activeSection, setActiveSection] = useState('organizations');
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [currentView, setCurrentView] = useState('organizations'); // organizations, projects, workflows

    const handleSelectOrg = (org: { id: string; name: string; [key: string]: unknown }) => {
        setSelectedOrg(org);
        setCurrentView('projects');
    };

    const handleSelectProject = (project: { id: string; name: string; [key: string]: unknown }) => {
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

    const renderContent = () => {
        if (activeSection === 'profile') {
            return <ProfileView user={user} />;
        }

        // Handle the drill-down views for organizations
        switch (currentView) {
            case 'organizations':
                return <OrganizationsView onSelectOrg={handleSelectOrg} user={user} />;
            case 'projects':
                return (
                    <ProjectsView
                        selectedOrg={selectedOrg}
                        onSelectProject={handleSelectProject}
                        onBack={() => handleBack('organizations')}
                        user={user}
                    />
                );
            case 'workflows':
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

    return (
        <div className="flex h-screen bg-gray-50">
            <Sidebar
                activeSection={activeSection}
                setActiveSection={handleSectionChange}
            />
            <div className="flex-1 overflow-hidden">
                {renderContent()}
            </div>
        </div>
    );
};
