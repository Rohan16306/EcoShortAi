import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { cookies } from 'next/headers';

export async function GET() {
    const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
    const pb = new PocketBase(pbUrl);
    
    // Grab the secure cookie from the incoming request
    const cookieStore = await cookies();
    const pbAuthCookie = cookieStore.get('pb_auth');

    if (!pbAuthCookie) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
        // Load the cookie data into the server-side PocketBase instance
        pb.authStore.loadFromCookie(pbAuthCookie.value);

        // Verify the token is still valid with the database
        if (pb.authStore.isValid) {
            // Optional: Refresh the user data to get the latest points/badges
            const user = await pb.collection('users').getOne(pb.authStore.model?.id as string);
            return NextResponse.json({ user });
        } else {
            throw new Error("Invalid token");
        }
    } catch (error) {
        // If the token is expired or invalid, clear the cookie
        const response = NextResponse.json({ error: 'Session expired' }, { status: 401 });
        response.cookies.delete('pb_auth');
        return response;
    }
}
