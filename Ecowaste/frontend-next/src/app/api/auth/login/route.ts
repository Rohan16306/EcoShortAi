import { NextResponse } from 'next/server';
import PocketBase from 'pocketbase';
import { z } from 'zod';
import { checkRateLimit, recordFailedAttempt, recordSuccessfulLogin } from '@/lib/rateLimit';

// 1. Zod Validation Schema
const loginSchema = z.object({
    email: z.string().email().max(255),
    password: z.string().min(1).max(255), // Basic max-length to prevent DoS via massive payloads
});

// Helper to delay execution (progressive delay)
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function POST(request: Request) {
    try {
        // Get IP for rate limiting (fallback to unknown if headers are missing)
        const ip = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

        // 2. Rate Limiting & Account Lockout
        const rateLimitStatus = checkRateLimit(ip);
        
        if (!rateLimitStatus.allowed) {
            // Lockout generic message (Don't reveal it's a lockout to attackers!)
            return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
        }

        // Apply progressive delay if necessary to slow down brute-force attacks
        if (rateLimitStatus.delayMs > 0) {
            await delay(rateLimitStatus.delayMs);
        }

        const body = await request.json();
        
        // 1. Validate Input Server-Side
        const validation = loginSchema.safeParse(body);
        if (!validation.success) {
            // Log server-side but return generic error to client
            console.warn(`[Login] Validation failed for IP: ${ip}`);
            recordFailedAttempt(ip);
            return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
        }

        const { email, password } = validation.data;
        
        // Connect to your local PocketBase instance
        const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || process.env.POCKETBASE_URL || 'http://127.0.0.1:8090';
        const pb = new PocketBase(pbUrl);

        // Authenticate on the SERVER side (PocketBase hashes passwords using bcrypt automatically)
        const authData = await pb.collection('users').authWithPassword(email, password);

        // Success - Clear failed attempts
        recordSuccessfulLogin(ip);

        // Prepare the success response
        const response = NextResponse.json({ 
            message: 'Logged in successfully',
            user: authData.record 
        });

        // Export the PocketBase auth state to a secure, HttpOnly cookie
        response.cookies.set('pb_auth', pb.authStore.exportToCookie(), {
            httpOnly: true, // Hides it from malicious JavaScript
            secure: process.env.NODE_ENV === 'production', // Requires HTTPS in prod
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 1 week
        });

        return response;
    } catch (error: any) {
        // Fallback for all authentication errors
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        console.warn(`[Login] Failed attempt for IP: ${ip}`, error?.message);
        
        // Record failed attempt for rate limiting
        recordFailedAttempt(ip);

        // 4. Generic Error Messages to prevent email enumeration
        return NextResponse.json({ error: 'Incorrect email or password' }, { status: 401 });
    }
}
