"use client";
import {Bell, HelpCircle, User, ChevronDown, LogOut, Settings} from "lucide-react";
import React, {useState} from "react";
import Image from "next/image";

interface HeaderProps {
  title: string;
  breadcrumb?: string;
  children?: React.ReactNode;
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
  onProfileClick?: () => void;
}

export const Header = ({ title, breadcrumb, children, user, onProfileClick }: HeaderProps) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleProfileClick = () => {
        if (onProfileClick) {
            onProfileClick();
        }
        setIsDropdownOpen(false);
    };

    return (
        <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div>
                    {breadcrumb && (
                        <div className="text-sm text-gray-500 mb-1">{breadcrumb}</div>
                    )}
                    <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                        <HelpCircle size={20} />
                    </button>
                    <button className="p-2 text-gray-500 hover:text-gray-700">
                        <Bell size={20} />
                    </button>
                    <div className="relative">
                        <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                {user?.profilePictureUrl ? (
                                    <Image 
                                        src={user.profilePictureUrl} 
                                        alt={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                        width={32}
                                        height={32}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <User size={16} className="text-white" />
                                )}
                            </div>
                            <ChevronDown size={16} className="text-gray-500" />
                        </button>
                        
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">
                                        {user?.firstName && user?.lastName 
                                            ? `${user.firstName} ${user.lastName}` 
                                            : user?.email}
                                    </p>
                                    <p className="text-xs text-gray-500">{user?.email}</p>
                                </div>
                                <button 
                                    onClick={handleProfileClick}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <User size={16} />
                                    Profile
                                </button>
                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                    <Settings size={16} />
                                    Settings
                                </button>
                                <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2">
                                    <LogOut size={16} />
                                    Sign Out
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
};
