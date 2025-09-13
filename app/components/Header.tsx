import {Bell, HelpCircle, User} from "lucide-react";
import React from "react";

export const Header = ({ title, breadcrumb, children }) => {
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
                        <User size={16} className="text-[#8661C1]" />
                    </div>
                </div>
            </div>
            {children}
        </div>
    );
};
