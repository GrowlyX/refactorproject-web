"use client";
import React from "react";
import {Header} from "@/app/components/Header";
import Image from "next/image";

interface ProfileViewProps {
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

export const ProfileView = ({ user }: ProfileViewProps) => {
    const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();
    const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();

    return (
        <div>
            <Header title="Profile" user={user} />
            <div className="p-6">
                <div className="max-w-2xl">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-[#EFBCD5] rounded-full flex items-center justify-center">
                                {user.profilePictureUrl ? (
                                    <Image 
                                        src={user.profilePictureUrl} 
                                        alt={fullName}
                                        width={80}
                                        height={80}
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[#8661C1] text-xl font-semibold">
                                        {initials}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">{fullName || user.email}</h2>
                                <p className="text-gray-500">{user.email}</p>
                                <span className="inline-flex mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                    User
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    First Name
                                </label>
                                <input
                                    type="text"
                                    value={user.firstName || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value={user.lastName || ''}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                                    readOnly
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={user.email}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                                    readOnly
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    AuthKit ID
                                </label>
                                <input
                                    type="text"
                                    value={user.id}
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent" disabled>
                                    <option>User</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button className="bg-gray-400 text-white px-6 py-2 rounded-md cursor-not-allowed" disabled>
                                Save Changes
                            </button>
                            <button className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

