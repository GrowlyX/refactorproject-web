import {User} from "lucide-react";
import React from "react";
import {Header} from "@/app/components/Header";

export const ProfileView = () => {
    return (
        <div>
            <Header title="Profile" />
            <div className="p-6">
                <div className="max-w-2xl">
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-20 h-20 bg-[#EFBCD5] rounded-full flex items-center justify-center">
                                <User size={32} className="text-[#8661C1]" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">Sarah Johnson</h2>
                                <p className="text-gray-500">sarah.johnson@example.com</p>
                                <span className="inline-flex mt-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Admin
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
                                    value="Sarah"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Last Name
                                </label>
                                <input
                                    type="text"
                                    value="Johnson"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value="sarah.johnson@example.com"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    AuthKit ID
                                </label>
                                <input
                                    type="text"
                                    value="auth_01H5J8K9L0M1N2O3P4Q5R6S7T8"
                                    disabled
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#8661C1] focus:border-transparent">
                                    <option>Admin</option>
                                    <option>Manager</option>
                                    <option>Developer</option>
                                    <option>Viewer</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button className="bg-[#8661C1] text-white px-6 py-2 rounded-md hover:bg-[#7550A8] transition-colors">
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
