"use client"
import {DashboardView} from "@/app/components/views/DashboardView";
import { withUser } from "@workos-inc/authkit-nextjs/components";

interface DashboardPageProps {
    user: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

const DashboardPageComponent = ({ user }: DashboardPageProps) => {
    return <DashboardView user={user} />;
};

export default withUser(DashboardPageComponent);
