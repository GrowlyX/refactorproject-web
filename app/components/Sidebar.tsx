import {Building2, Settings, User, LogOut} from "lucide-react";
import React from "react";
import { handleSignOutAction } from "@/lib/actions/signOut";

interface SidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
}

export const Sidebar = ({ activeSection, setActiveSection }: SidebarProps) => {
    const menuItems = [
        { id: 'organizations', label: 'Organizations', icon: Building2 },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const MenuItem = ({ item, isActive, onClick }: { item: { id: string; label: string; icon: React.ComponentType<{ size: number }> }; isActive: boolean; onClick: (id: string) => void }) => {
        const Icon = item.icon;

        return (
            <button
                onClick={() => onClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors ${
                    isActive
                        ? 'bg-[#8661C1] text-white'
                        : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
            >
                <Icon size={16} />
                <span className="flex-1 text-left">{item.label}</span>
            </button>
        );
    };

    return (
        <div className="w-64 bg-gray-900 text-white h-screen flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-[#8661C1] rounded-md flex items-center justify-center">
                        <span className="text-white font-bold text-sm">D</span>
                    </div>
                    <span className="font-semibold">Dashboard</span>
                </div>
            </div>

            {/* Menu Items */}
            <div className="flex-1 overflow-y-auto p-3">
                <div className="space-y-1">
                    {menuItems.map(item => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            isActive={activeSection === item.id}
                            onClick={setActiveSection}
                        />
                    ))}
                </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-800 space-y-1">
                <button className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-gray-300 hover:text-white hover:bg-gray-800">
                    <Settings size={16} />
                    Settings
                </button>
                <form action={handleSignOutAction}>
                    <button 
                        type="submit"
                        className="w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md text-gray-300 hover:text-white hover:bg-gray-800"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </form>
            </div>
        </div>
    );
};
