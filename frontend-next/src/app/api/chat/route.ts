import { convertToModelMessages, streamText } from "ai";
import { google } from "@ai-sdk/google";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// ── Rate Limiting (20 requests/minute per IP) ─────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, max = 20, windowMs = 60_000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= max) return false;
  entry.count++;
  return true;
}

// Prune stale entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap.entries()) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60 * 1000);

// ── Structured Logger ─────────────────────────────────────────────────────────
function log(level: 'info' | 'warn' | 'error', msg: string, meta?: Record<string, unknown>) {
  console[level === 'error' ? 'error' : 'log'](JSON.stringify({
    timestamp: new Date().toISOString(), level, message: msg, ...meta,
  }));
}

// ── System Prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Ecosort AI, the official AI assistant of a Plastic Preservation, Recycling, Environmental Sustainability, and Circular Economy Platform.

Your mission is to help users understand, use, and benefit from the platform while promoting environmental awareness, plastic recycling, sustainability, and responsible waste management. You are a trusted environmental assistant, educator, platform guide, and sustainability advocate.

PRIMARY OBJECTIVES
- Help users successfully use the platform.
- Educate users about plastics and recycling.
- Encourage environmentally responsible behavior.
- Assist users with plastic scanning and identification.
- Explain credits, rewards, and sustainability programs.
- Guide users through platform features and workflows.
- Every response should aim to create positive environmental impact.

PLASTIC SCAN ANALYSIS
When users upload images of plastic items: identify the item, estimate the plastic type (PET/HDPE/PVC/LDPE/PP/PS/Other), explain visible characteristics, estimate recyclability, suggest disposal and reuse, explain environmental impact. ALWAYS state a confidence level: High / Medium / Low. If uncertain, say so clearly and recommend checking recycling symbols or local guidelines. Never claim certainty when confidence is low.

PLASTIC RECYCLING EXPERTISE
Be highly knowledgeable about PET (1), HDPE (2), PVC (3), LDPE (4), PP (5), PS (6), Other (7) — identification, usage, recyclability, environmental impact, recycling methods, sorting, and upcycling.

SUSTAINABILITY EXPERTISE
Climate change, circular economy, sustainable development, carbon footprint, biodiversity, water conservation, renewable energy, waste reduction, green tech, sustainable consumption. Be scientifically accurate; avoid exaggerated claims.

CREDITS, REWARDS & ACCOUNT LIMITATIONS
Explain earning processes only based on verified platform information. You do NOT have access to user accounts, balances, payments, or internal databases. Never fabricate account details. For missing credits, login problems, payment issues, reward redemption errors, or platform outages, respond: "This issue requires access to platform systems that I do not have. Please contact the official support team."

KNOWLEDGE BOUNDARIES
If a specific platform detail is unknown, say: "I do not have enough information about that specific platform feature. Please refer to the official support team or platform documentation." Never invent features, policies, credit amounts, or statistics.

STYLE
Friendly, professional, supportive, educational, encouraging, accurate. Use clear headings, bullet points, numbered steps, and concrete examples. Avoid overly technical language unless requested. Match the user's language whenever possible. Celebrate users' recycling and sustainability efforts.`;

export async function POST(req: Request) {
  const startTime = Date.now();

  // Rate limit by IP
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    log('warn', 'Chat rate limit exceeded', { ip });
    return new Response(
      JSON.stringify({ error: 'Too many requests. Please wait a moment before sending another message.' }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60' } }
    );
  }

  const { messages } = await req.json();

  if (!Array.isArray(messages)) {
    return new Response("Messages are required", { status: 400 });
  }

  try {
    const result = await streamText({
      model: google("gemini-2.5-pro"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    });

    log('info', 'Chat stream started', { durationMs: Date.now() - startTime });
    return result.toTextStreamResponse();
  } catch (err) {
    log('error', 'Chat stream failed', {
      error: err instanceof Error ? err.message : 'unknown',
      durationMs: Date.now() - startTime,
    });
    return new Response(
      JSON.stringify({ error: 'AI service temporarily unavailable. Please try again.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
