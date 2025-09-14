import { NextRequest, NextResponse } from 'next/server';
import {authkit} from '@workos-inc/authkit-nextjs';
import { getUserOrganizations } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  try {
      const { session } = await authkit(request);
      const user = session.user
      if (!user) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

    const organizations = await getUserOrganizations(session);

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
