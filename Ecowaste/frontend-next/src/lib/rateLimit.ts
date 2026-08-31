interface RateLimitData {
    count: number;
    lockoutUntil?: number;
}

// In-memory store (Note: In a true serverless environment, this resets on cold boot. Use Redis for production.)
const ipRequests = new Map<string, RateLimitData>();

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export function checkRateLimit(ip: string): { allowed: boolean; delayMs: number } {
    const now = Date.now();
    let data = ipRequests.get(ip);

    if (!data) {
        data = { count: 0 };
        ipRequests.set(ip, data);
    }

    // Check if currently locked out
    if (data.lockoutUntil && now < data.lockoutUntil) {
        return { allowed: false, delayMs: 0 };
    }

    // If lockout has expired, reset count
    if (data.lockoutUntil && now >= data.lockoutUntil) {
        data.count = 0;
        data.lockoutUntil = undefined;
    }

    // Progressive delay logic:
    // attempt 1-2: 0ms
    // attempt 3: 1000ms
    // attempt 4: 2000ms
    // attempt 5: 5000ms
    let delayMs = 0;
    if (data.count === 2) delayMs = 1000;
    else if (data.count === 3) delayMs = 2000;
    else if (data.count === 4) delayMs = 5000;

    return { allowed: true, delayMs };
}

export function recordFailedAttempt(ip: string) {
    const now = Date.now();
    const data = ipRequests.get(ip) || { count: 0 };
    
    data.count += 1;

    // Trigger lockout on MAX_ATTEMPTS
    if (data.count >= MAX_ATTEMPTS) {
        data.lockoutUntil = now + LOCKOUT_DURATION_MS;
    }

    ipRequests.set(ip, data);
}

export function recordSuccessfulLogin(ip: string) {
    ipRequests.delete(ip);
}
