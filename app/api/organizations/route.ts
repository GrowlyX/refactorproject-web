import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { getUserOrganizations } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
      const { session } = await authkit(request);
      const user = session.user.user
      if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const userInfo = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePictureUrl: user.profilePictureUrl,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      sessionId: 'temp-session-id', // This would come from the actual session
      accessToken: 'temp-access-token', // This would come from the actual session
    };

    const organizations = await getUserOrganizations(userInfo);

    return NextResponse.json({
      success: true,
      organizations,
    });

  } catch (error) {
    console.error('Get organizations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizations', details: error.message },
      { status: 500 }
    );
  }
}
