import React, {useState} from "react";
import {Sidebar} from "@/app/components/Sidebar";
import {ProfileView} from "@/app/components/views/ProfileView";
import {OrganizationsView} from "@/app/components/views/OrganizationsView";
import {ProjectsView} from "@/app/components/views/ProjectsView";
import {WorkflowsView} from "@/app/components/views/WorkflowsView";

interface DashboardViewProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export const DashboardView = ({ user }: DashboardViewProps) => {
    const [activeSection, setActiveSection] = useState('organizations');
    const [selectedOrg, setSelectedOrg] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [currentView, setCurrentView] = useState('organizations'); // organizations, projects, workflows

    const handleSelectOrg = (org) => {
        setSelectedOrg(org);
        setCurrentView('projects');
    };

    const handleSelectProject = (project) => {
        setSelectedProject(project);
        setCurrentView('workflows');
    };

    const handleBack = (target) => {
        if (target === 'organizations') {
            setSelectedOrg(null);
            setSelectedProject(null);
            setCurrentView('organizations');
        } else if (target === 'projects') {
            setSelectedProject(null);
            setCurrentView('projects');
        }
    };

    const handleSectionChange = (section) => {
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
                return <OrganizationsView onSelectOrg={handleSelectOrg} />;
            case 'projects':
                return (
                    <ProjectsView
                        selectedOrg={selectedOrg}
                        onSelectProject={handleSelectProject}
                        onBack={() => handleBack('organizations')}
                    />
                );
            case 'workflows':
                return (
                    <WorkflowsView
                        selectedProject={selectedProject}
                        selectedOrg={selectedOrg}
                        onBack={handleBack}
                    />
                );
            default:
                return <OrganizationsView onSelectOrg={handleSelectOrg} />;
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
