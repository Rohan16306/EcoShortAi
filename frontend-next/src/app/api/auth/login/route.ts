import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();
        
        // Connect to your local PocketBase instance
        const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
        const pb = new PocketBase(pbUrl);

        // Authenticate as normal, but on the SERVER side
        const authData = await pb.collection('users').authWithPassword(email, password);

        // Prepare the success response
        const response = NextResponse.json({ 
            message: 'Logged in successfully',
            user: authData.record 
        });

        // The Magic: Export the PocketBase auth state to a secure, HttpOnly cookie
        response.cookies.set('pb_auth', pb.authStore.exportToCookie(), {
            httpOnly: true, // Hides it from malicious JavaScript
            secure: process.env.NODE_ENV === 'production', // Requires HTTPS in prod
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;
    } catch (error) {
        console.error("Login Error:", error);
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
}
