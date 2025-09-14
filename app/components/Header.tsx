import {Bell, HelpCircle, User} from "lucide-react";
import React from "react";
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
}

export const Header = ({ title, breadcrumb, children, user }: HeaderProps) => {
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
                    <div className="w-8 h-8 bg-[#EFBCD5] rounded-full flex items-center justify-center">
                        {user?.profilePictureUrl ? (
                            <Image 
                                src={user.profilePictureUrl} 
                                alt={user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email}
                                width={32}
                                height={32}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <User size={16} className="text-[#8661C1]" />
                        )}
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
};
