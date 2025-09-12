import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await (await clerkClient()).users.getUser(userId);

    if (!user) {
      return new NextResponse(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const userProfile = {
      id: user.id,
      username: user.username,
      first_name: user.firstName,
      last_name: user.lastName,
      email: user.emailAddresses[0]?.emailAddress || '',
      created_at: new Date(user.createdAt).toISOString(),
      last_login: user.lastSignInAt ? new Date(user.lastSignInAt).toISOString() : new Date().toISOString(),
    };

    return new NextResponse(JSON.stringify(userProfile), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Failed to fetch user:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}