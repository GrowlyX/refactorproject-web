import {DashboardView} from "@/app/components/views/DashboardView";
import {withAuth} from "@workos-inc/authkit-nextjs";

export default async function Dashboard() {
    const { user } = await withAuth({ ensureSignedIn: true });
    
    return <DashboardView user={user} />;
}
