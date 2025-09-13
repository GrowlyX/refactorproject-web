import {createOrganizationFromGitHub} from "@/lib/github/githubActions";
import {authkit} from "@workos-inc/authkit-nextjs";
import {NextRequest} from "next/server";

export async function POST(request: NextRequest) {
    try {
        // Get user info from your auth system (WorkOS)
        const { session } = await authkit(request);
        if (!session.user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { orgName } = await request.json();

        if (!orgName) {
            return Response.json({ error: 'Organization name is required' }, { status: 400 });
        }

        // Try to create the organization (this will validate everything)
        const result = await createOrganizationFromGitHub(orgName, session);

        return Response.json(result);
    } catch (error) {
        console.error('Error in poll org route:', error);
        return Response.json({
            success: false,
            error: 'Internal server error'
        }, { status: 500 });
    }
}
