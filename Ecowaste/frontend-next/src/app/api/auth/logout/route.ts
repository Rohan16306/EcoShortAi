import { NextResponse } from 'next/server';

export async function POST() {
    const response = NextResponse.json({ message: 'Logged out successfully' });
    // Destroy the HttpOnly cookie by setting an expired date
    response.cookies.delete('pb_auth');
    return response;
}
