import {checkExistingOrgAccess} from "@/lib/github/githubActions";
import {authkit} from "@workos-inc/authkit-nextjs";
import {NextRequest} from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: { orgName: string } }
) {
    try {
        // Get user info from your auth system (WorkOS)
        const { session } = await authkit(request);
        if (!session.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const orgName = decodeURIComponent(params.orgName);
        const result = await checkExistingOrgAccess(orgName, session);

        return Response.json(result);
    } catch (error) {
        console.error('Error in check org route:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
