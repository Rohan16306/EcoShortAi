require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { GoogleGenAI } = require('@google/genai');

let ai;
if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

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

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const DB_PATH = path.join(__dirname, 'backend', 'data', 'db.json');
const DB_TMP_PATH = path.join(__dirname, 'backend', 'data', 'db.tmp.json');
const BACKUP_DIR = path.join(__dirname, 'backend', 'data', 'backups');
const MAX_HISTORY_ITEMS = 200;
const MAX_HASH_ITEMS = 200;
const MAX_COMMUNITY_POSTS = 300;
const MAX_CONTACTS = 500;
const SCAN_VERIFY_TTL_MS = 10 * 60 * 1000;
const STEP2_LOCATION_MAX_DISTANCE_METERS = 80;
const STEP2_LOCATION_MAX_TOLERANCE_METERS = 350;
const MAX_BACKUPS = 5;

const USER_COMPLETION_CREDITS = 50;
const COLLECTOR_COMPLETION_CREDITS = 100;
const COUPON_VALIDITY_DAYS = 30;

let dbCache = null;

// ============================================================
// FIX #5: Token Blacklist for Logout
// ============================================================
const tokenBlacklist = new Map(); // token -> expiresAt (ms)

function blacklistToken(token) {
  try {
    const decoded = jwt.decode(token);
    if (decoded && decoded.exp) {
      tokenBlacklist.set(token, decoded.exp * 1000);
    } else {
      // If no exp, blacklist for 7 days (default JWT expiry)
      tokenBlacklist.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
    }
  } catch (_e) {
    tokenBlacklist.set(token, Date.now() + 7 * 24 * 60 * 60 * 1000);
  }
}

function isTokenBlacklisted(token) {
  return tokenBlacklist.has(token);
}

function cleanupBlacklist() {
  const now = Date.now();
  for (const [token, expiresAt] of tokenBlacklist.entries()) {
    if (now >= expiresAt) {
      tokenBlacklist.delete(token);
    }
  }
}

// Clean up expired blacklist entries every 15 minutes
setInterval(cleanupBlacklist, 15 * 60 * 1000);

// ============================================================
// FIX #6: Rate Limiting Middleware
// ============================================================
const rateLimitBuckets = new Map(); // key -> { count, resetAt }

function rateLimiter(windowMs, maxRequests, keyFn) {
  return (req, res, next) => {
    const key = typeof keyFn === 'function' ? keyFn(req) : (req.ip || 'unknown');
    const now = Date.now();

    let bucket = rateLimitBuckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      rateLimitBuckets.set(key, bucket);
    }

    bucket.count++;

    if (bucket.count > maxRequests) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.set('Retry-After', String(retryAfter));
      return res.status(429).json({
        error: 'Too many requests. Please wait before trying again.',
        retryAfterSeconds: retryAfter
      });
    }

    next();
  };
}

// Clean up stale rate limit buckets every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (now >= bucket.resetAt) {
      rateLimitBuckets.delete(key);
    }
  }
}, 5 * 60 * 1000);

// Rate limit presets
const authRateLimit = rateLimiter(60 * 1000, 10, req => `auth:${req.ip}`);       // 10 req/min per IP
const chatRateLimit = rateLimiter(60 * 1000, 20, req => `chat:${req.ip}`);       // 20 req/min per IP
const communityRateLimit = rateLimiter(60 * 1000, 5, req => `community:${req.ip}`); // 5 req/min per IP
const contactRateLimit = rateLimiter(60 * 1000, 3, req => `contact:${req.ip}`);   // 3 req/min per IP

// ============================================================
// Default Data Definitions
// ============================================================

function defaultFeaturedMedia() {
  return [
    {
      id: 'hero-cleanup',
      type: 'image',
      title: 'Community Cleanup Drives',
      description: 'Local volunteers collect and sort waste with EcoSort AI guidance.',
      src: 'assets/images/cleanup-forest.jpg'
    },
    {
      id: 'facility-line',
      type: 'video',
      title: 'Smart Sorting Facility',
      description: 'Material recognition and routing in a real recycling stream.',
      src: 'assets/videos/recycling-facility.webm'
    },
    {
      id: 'bin-network',
      type: 'image',
      title: 'City Drop-off Network',
      description: 'Color-coded bins make correct disposal faster and easier.',
      src: 'assets/images/recycling-bins.jpg'
    },
    {
      id: 'aerial-plant',
      type: 'video',
      title: 'Plant Operations Overview',
      description: 'Aerial perspective of recycling operations and logistics.',
      src: 'assets/videos/recycling-aerial.mp4'
    },
    {
      id: 'ewaste-recovery',
      type: 'image',
      title: 'E-waste Recovery',
      description: 'Electronic components are separated for safer material recovery.',
      src: 'assets/images/ewaste-boards.jpg'
    },
    {
      id: 'urban-bins',
      type: 'image',
      title: 'Urban Sorting Point',
      description: 'Street-level sorting stations with clear color guidance.',
      src: 'https://images.unsplash.com/photo-1621451537084-482c73073a0f?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'plastic-recovery',
      type: 'image',
      title: 'Plastic Recovery Line',
      description: 'PET and HDPE streams are separated for high-value recycling.',
      src: 'https://images.unsplash.com/photo-1528323273322-d81458248d40?auto=format&fit=crop&w=1200&q=80'
    },
    {
      id: 'community-bins',
      type: 'image',
      title: 'Neighborhood Bin Cluster',
      description: 'Citizens use guided bins to reduce contamination.',
      src: 'https://images.unsplash.com/photo-1582408921715-18e7806365c1?auto=format&fit=crop&w=1200&q=80'
    }
  ];
}

function defaultCommunityPosts() {
  return [
    {
      id: crypto.randomUUID(),
      type: 'chat',
      author: 'Eco Team',
      text: 'Welcome to the community wall. Share your recycling progress and local cleanup updates.',
      imageUrl: '',
      createdAt: new Date().toISOString()
    },
    {
      id: crypto.randomUUID(),
      type: 'story',
      author: 'City Volunteer',
      text: 'We cleaned 12 bags of plastic from our neighborhood lake this weekend.',
      imageUrl: 'assets/images/cleanup-forest.jpg',
      createdAt: new Date().toISOString()
    }
  ];
}

function defaultRewards() {
  return [
    { id: crypto.randomUUID(), title: '10% Off Eco-Store', description: 'Get 10% off your next purchase of eco-friendly products.', cost: 500, role: 'ROLE_USER', inStock: true },
    { id: crypto.randomUUID(), title: 'Free Reusable Bag', description: 'Claim a free reusable organic cotton bag.', cost: 1000, role: 'ROLE_USER', inStock: true },
    { id: crypto.randomUUID(), title: '$20 Bonus Payout', description: 'Direct $20 bonus to your collector account.', cost: 2000, role: 'ROLE_COLLECTOR', inStock: true },
    { id: crypto.randomUUID(), title: 'Priority Routing', description: 'Get priority on high-value pickups for a week.', cost: 1500, role: 'ROLE_COLLECTOR', inStock: true },
    { id: crypto.randomUUID(), title: 'Platform Manager Badge', description: 'Exclusive badge for active admins.', cost: 5000, role: 'ROLE_ADMIN', inStock: true },
    { id: crypto.randomUUID(), title: 'Analytics Export Tool', description: 'Unlock advanced analytics export feature.', cost: 10000, role: 'ROLE_ADMIN', inStock: true }
  ];
}

function defaultUserData() {
  return {
    credits: 0,
    history: [],
    claimedRewards: [],
    badges: [],
    imageHashes: [],
    lastUpdated: new Date().toISOString()
  };
}

// ============================================================
// FIX #9: Input Validation Hardening
// ============================================================
function sanitizeIncomingData(incoming) {
  const safeHistory = Array.isArray(incoming.history)
    ? incoming.history
        .slice(0, MAX_HISTORY_ITEMS)
        .map((item) => ({
          id: Number(item?.id) || Date.now(),
          name: String(item?.name || 'Unknown').slice(0, 120),
          material: String(item?.material || 'Other').slice(0, 40),
          credits: Number(item?.credits) || 0,
          date: item?.date || new Date().toISOString(),
          image: null,
          isDuplicate: Boolean(item?.isDuplicate),
          duplicateType: item?.duplicateType || null,
          geoTag: item?.geoTag && typeof item.geoTag === 'object'
            ? {
                lat: Number(item.geoTag.lat),
                lng: Number(item.geoTag.lng),
                accuracy: Number(item.geoTag.accuracy) || 0,
                timestamp: item.geoTag.timestamp || new Date().toISOString()
              }
            : null
        }))
    : [];

  const safeHashes = Array.isArray(incoming.imageHashes)
    ? incoming.imageHashes
        .filter((entry) => entry && typeof entry.hash === 'string' && entry.hash.length > 0)
        .slice(0, MAX_HASH_ITEMS)
    : [];

  return {
    credits: Number(incoming.credits) || 0,
    history: safeHistory,
    claimedRewards: Array.isArray(incoming.claimedRewards) ? incoming.claimedRewards.slice(0, 200) : [],
    badges: Array.isArray(incoming.badges) ? incoming.badges.slice(0, 200) : [],
    imageHashes: safeHashes,
    lastUpdated: new Date().toISOString()
  };
}

// ============================================================
// Database Layer — Fixes #1, #2, #3, #4
// ============================================================

function ensureDb() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(
      DB_PATH,
      JSON.stringify(
        {
          users: [],
          userData: {},
          contacts: [],
          scanSessions: {},
          content: {
            featuredMedia: defaultFeaturedMedia(),
            communityPosts: defaultCommunityPosts(),
            rewards: defaultRewards()
          }
        },
        null,
        2
      ),
      'utf8'
    );
  }
}

// FIX #3: Automatic Backup on Startup
function createStartupBackup() {
  try {
    if (!fs.existsSync(DB_PATH)) return;
    if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupName = `db.backup_${timestamp}.json`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    fs.copyFileSync(DB_PATH, backupPath);
    console.log(`[Backup] Created startup backup: ${backupName}`);

    // Keep only the last MAX_BACKUPS
    const backups = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('db.backup_') && f.endsWith('.json'))
      .sort()
      .reverse();

    for (let i = MAX_BACKUPS; i < backups.length; i++) {
      fs.unlinkSync(path.join(BACKUP_DIR, backups[i]));
      console.log(`[Backup] Removed old backup: ${backups[i]}`);
    }
  } catch (err) {
    console.error('[Backup] Failed to create startup backup:', err.message);
  }
}

function readDb() {
  if (dbCache) {
    return dbCache;
  }

  try {
    ensureDb();
    const raw = fs.readFileSync(DB_PATH, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    const fallbackFeatured = defaultFeaturedMedia();
    const parsedFeatured = Array.isArray(parsed.content?.featuredMedia) ? parsed.content.featuredMedia : [];
    const normalized = {
      users: Array.isArray(parsed.users) ? parsed.users : [],
      userData: parsed.userData && typeof parsed.userData === 'object' ? parsed.userData : {},
      contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
      scanSessions: parsed.scanSessions && typeof parsed.scanSessions === 'object' ? parsed.scanSessions : {},
      pickups: Array.isArray(parsed.pickups) ? parsed.pickups : [],
      content: {
        featuredMedia: parsedFeatured.length >= fallbackFeatured.length ? parsedFeatured : fallbackFeatured,
        communityPosts: Array.isArray(parsed.content?.communityPosts)
          ? parsed.content.communityPosts
          : defaultCommunityPosts(),
        rewards: Array.isArray(parsed.content?.rewards)
          ? parsed.content.rewards
          : defaultRewards()
      }
    };

    const needsMigration =
      !Array.isArray(parsed.users) ||
      !(parsed.userData && typeof parsed.userData === 'object') ||
      !Array.isArray(parsed.contacts) ||
      !(parsed.scanSessions && typeof parsed.scanSessions === 'object') ||
      !Array.isArray(parsed.content?.featuredMedia) ||
      !Array.isArray(parsed.content?.communityPosts) ||
      !Array.isArray(parsed.content?.rewards);

    if (needsMigration) {
      fs.writeFileSync(DB_PATH, JSON.stringify(normalized, null, 2), 'utf8');
    }

    dbCache = normalized;
    return dbCache;
  } catch (err) {
    console.error('readDb error (using fallback):', err.message);
    const fallback = {
      users: [],
      userData: {},
      contacts: [],
      scanSessions: {},
      pickups: [],
      content: {
        featuredMedia: defaultFeaturedMedia(),
        communityPosts: defaultCommunityPosts()
      }
    };
    dbCache = fallback;
    return dbCache;
  }
}

// FIX #1: Atomic File Writes + FIX #2: Write Queue / Mutex
let writeQueue = Promise.resolve();
let pendingWrite = false;

function writeDb(db) {
  dbCache = db;
  if (!pendingWrite) {
    pendingWrite = true;
    writeQueue = writeQueue.then(() => flushDb()).catch(err => {
      console.error('[DB] Write failed:', err.message);
    });
  }
}

async function flushDb() {
  pendingWrite = false;
  if (!dbCache) return;

  try {
    const data = JSON.stringify(dbCache, null, 2);
    // Write to temp file first, then atomically rename
    await fs.promises.writeFile(DB_TMP_PATH, data, 'utf8');
    await fs.promises.rename(DB_TMP_PATH, DB_PATH);
  } catch (err) {
    console.error('[DB] Atomic write failed:', err.message);
    // Fallback: try direct write
    try {
      await fs.promises.writeFile(DB_PATH, JSON.stringify(dbCache, null, 2), 'utf8');
    } catch (fallbackErr) {
      console.error('[DB] Fallback write also failed:', fallbackErr.message);
    }
  }
}

// Force synchronous flush (for graceful shutdown)
function flushDbSync() {
  if (!dbCache) return;
  try {
    const data = JSON.stringify(dbCache, null, 2);
    fs.writeFileSync(DB_TMP_PATH, data, 'utf8');
    fs.renameSync(DB_TMP_PATH, DB_PATH);
    console.log('[DB] Synchronous flush completed.');
  } catch (err) {
    console.error('[DB] Sync flush failed:', err.message);
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(dbCache, null, 2), 'utf8');
    } catch (_e) { /* last resort failed */ }
  }
}

// ============================================================
// FIX #4: Persistent Scan Verification Sessions
// ============================================================
function loadScanSessions() {
  const db = readDb();
  const sessions = db.scanSessions || {};
  const now = Date.now();
  const loaded = new Map();

  for (const [id, session] of Object.entries(sessions)) {
    if (session && now - session.createdAt <= SCAN_VERIFY_TTL_MS) {
      loaded.set(id, session);
    }
  }

  return loaded;
}

function saveScanSessions(sessionsMap) {
  const db = readDb();
  const obj = {};
  for (const [id, session] of sessionsMap.entries()) {
    obj[id] = session;
  }
  db.scanSessions = obj;
  writeDb(db);
}

// Load persisted sessions on startup
let scanVerificationSessions;

// ============================================================
// Auth Helpers
// ============================================================

function sanitizeUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt
  };
}

function generateToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  // FIX #5: Check blacklist before verifying
  if (isTokenBlacklisted(token)) {
    return res.status(401).json({ error: 'Token has been revoked. Please log in again.' });
  }

  try {
    const pbRes = await fetch('http://127.0.0.1:8090/api/collections/users/auth-refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (pbRes.ok) {
      const pbData = await pbRes.json();
      req.userId = pbData.record.id;
      req.authToken = token;
      return next();
    }

    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.authToken = token;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

async function extractUserIdFromAuth(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  if (isTokenBlacklisted(token)) return null;

  try {
    const pbRes = await fetch('http://127.0.0.1:8090/api/collections/users/auth-refresh', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (pbRes.ok) {
      const pbData = await pbRes.json();
      return pbData.record.id;
    }

    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub || null;
  } catch (_err) {
    return null;
  }
}

// ============================================================
// Scan Verification Helpers
// ============================================================

function cleanupExpiredVerificationSessions() {
  const now = Date.now();
  let changed = false;
  for (const [id, session] of scanVerificationSessions.entries()) {
    if (!session || now - session.createdAt > SCAN_VERIFY_TTL_MS) {
      scanVerificationSessions.delete(id);
      changed = true;
    }
  }
  if (changed) saveScanSessions(scanVerificationSessions);
}

function toRad(value) {
  return (Number(value) * Math.PI) / 180;
}

function distanceMeters(a, b) {
  if (!a || !b) return null;
  if (!Number.isFinite(Number(a.lat)) || !Number.isFinite(Number(a.lng))) return null;
  if (!Number.isFinite(Number(b.lat)) || !Number.isFinite(Number(b.lng))) return null;

  const earthRadius = 6371000;
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLng = toRad(Number(b.lng) - Number(a.lng));
  const lat1 = toRad(Number(a.lat));
  const lat2 = toRad(Number(b.lat));

  const hav =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return earthRadius * c;
}

function getLocationToleranceMeters(step1Location, step2Location) {
  const base = STEP2_LOCATION_MAX_DISTANCE_METERS;
  const step1Accuracy = Number(step1Location?.accuracy) || 0;
  const step2Accuracy = Number(step2Location?.accuracy) || 0;
  const accuracyAllowance = Math.max(step1Accuracy, step2Accuracy);
  const tolerance = Math.max(base, accuracyAllowance);
  return Math.min(tolerance, STEP2_LOCATION_MAX_TOLERANCE_METERS);
}

// ============================================================
// FIX #7: Fix AI Chat Consecutive User Messages
// ============================================================
function normalizeContentsForGemini(messages) {
  const contentsArray = [];

  for (const msg of messages) {
    const role = msg.role === 'assistant' ? 'model' : 'user';
    const parts = [{ text: msg.content || ' ' }];

    if (msg.image && msg.mimeType) {
      parts.push({
        inlineData: {
          data: msg.image,
          mimeType: msg.mimeType
        }
      });
    }

    // If the last entry has the same role, merge the text into it
    if (contentsArray.length > 0 && contentsArray[contentsArray.length - 1].role === role) {
      contentsArray[contentsArray.length - 1].parts.push({ text: msg.content || ' ' });
      if (msg.image && msg.mimeType) {
        contentsArray[contentsArray.length - 1].parts.push({
          inlineData: { data: msg.image, mimeType: msg.mimeType }
        });
      }
    } else {
      contentsArray.push({ role, parts });
    }
  }

  // Gemini requires the first message to be from 'user'
  if (contentsArray.length > 0 && contentsArray[0].role !== 'user') {
    contentsArray.unshift({ role: 'user', parts: [{ text: 'Hello' }] });
  }

  // Ensure alternation: if two consecutive entries have the same role after merging,
  // insert a placeholder from the other role
  const fixed = [];
  for (let i = 0; i < contentsArray.length; i++) {
    if (i > 0 && fixed[fixed.length - 1].role === contentsArray[i].role) {
      const insertRole = contentsArray[i].role === 'user' ? 'model' : 'user';
      fixed.push({ role: insertRole, parts: [{ text: '...' }] });
    }
    fixed.push(contentsArray[i]);
  }

  return fixed;
}

// ============================================================
// Express Setup
// ============================================================

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request timeout middleware
const REQUEST_TIMEOUT_MS = 300000; // Increased for AI requests and Next.js first load compilation
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timed out' });
    }
  });
  next();
});

// ============================================================
// Routes
// ============================================================

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

// --- Scan Verification ---
app.post('/api/scan/verify/start', async (req, res) => {
  cleanupExpiredVerificationSessions();

  const photo = req.body?.photo;
  if (!photo || typeof photo !== 'object') {
    return res.status(400).json({ error: 'Missing photo scan payload' });
  }

  const verificationId = crypto.randomUUID();
  const userId = await extractUserIdFromAuth(req);

  const session = {
    id: verificationId,
    createdAt: Date.now(),
    userId,
    photo: {
      label: String(photo.label || '').slice(0, 120),
      material: String(photo.material || 'Other').slice(0, 40),
      isRecyclable: Boolean(photo.isRecyclable),
      predictedCredits: Number(photo.predictedCredits) || 0,
      duplicateBlocked: Boolean(photo.duplicateBlocked),
      location: photo.location && typeof photo.location === 'object'
        ? {
            lat: Number(photo.location.lat),
            lng: Number(photo.location.lng),
            accuracy: Number(photo.location.accuracy) || 0
          }
        : null
    }
  };

  scanVerificationSessions.set(verificationId, session);
  saveScanSessions(scanVerificationSessions); // FIX #4: Persist

  return res.status(201).json({
    verificationId,
    expiresInSeconds: Math.floor(SCAN_VERIFY_TTL_MS / 1000)
  });
});

app.post('/api/scan/verify/complete', (req, res) => {
  cleanupExpiredVerificationSessions();

  const verificationId = String(req.body?.verificationId || '').trim();
  const step2 = req.body?.step2 || req.body?.video;

  if (!verificationId) {
    return res.status(400).json({ error: 'Missing verificationId' });
  }
  if (!step2 || typeof step2 !== 'object') {
    return res.status(400).json({ error: 'Missing step2 scan payload' });
  }

  const session = scanVerificationSessions.get(verificationId);
  if (!session) {
    return res.status(404).json({ error: 'Verification session not found or expired' });
  }

  // Prototype relaxation: If both are recyclable, treat it as a match to prevent AI camera jitter failures
  const isStep2Recyclable = Boolean(step2.isRecyclable);
  const materialMatched = (session.photo.material === String(step2.material || 'Other')) || (session.photo.isRecyclable && isStep2Recyclable);
  const recyclableMatched = (session.photo.isRecyclable === isStep2Recyclable) || isStep2Recyclable;
  const step2Location = step2.location && typeof step2.location === 'object'
    ? {
        lat: Number(step2.location.lat),
        lng: Number(step2.location.lng),
        accuracy: Number(step2.location.accuracy) || 0
      }
    : null;
  const hasBothLocations = Boolean(session.photo.location && step2Location);
  const locationDistanceMeters = hasBothLocations
    ? distanceMeters(session.photo.location, step2Location)
    : null;
  const locationToleranceMeters = hasBothLocations
    ? getLocationToleranceMeters(session.photo.location, step2Location)
    : null;
  const locationMatched = !hasBothLocations
    || (Number.isFinite(locationDistanceMeters) && locationDistanceMeters <= locationToleranceMeters);
  const matched = materialMatched && recyclableMatched && locationMatched;
  const duplicateBlocked = session.photo.duplicateBlocked;
  const awardedCredits = matched && !duplicateBlocked ? Math.max(0, session.photo.predictedCredits) : 0;

  scanVerificationSessions.delete(verificationId);
  saveScanSessions(scanVerificationSessions); // FIX #4: Persist

  return res.json({
    verificationId,
    matched,
    materialMatched,
    recyclableMatched,
    locationMatched,
    locationDistanceMeters: Number.isFinite(locationDistanceMeters) ? Math.round(locationDistanceMeters) : null,
    locationToleranceMeters: Number.isFinite(locationToleranceMeters) ? Math.round(locationToleranceMeters) : null,
    duplicateBlocked,
    awardedCredits,
    reason: duplicateBlocked
      ? 'Duplicate protection blocked this scan.'
      : matched
        ? hasBothLocations
          ? 'Step 1 and Step 2 matched, and location check passed.'
          : 'Step 1 and Step 2 matched. Location check skipped because geolocation was unavailable.'
        : !materialMatched || !recyclableMatched
          ? 'Step 1 and Step 2 outputs did not match.'
          : 'Location validation failed. Credits are locked until location matches.'
  });
});

// --- Auth ---
app.post('/api/auth/signup', authRateLimit, async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password || '';

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = readDb();
    if (db.users.some((u) => u.email === email)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const role = (req.body?.role || 'ROLE_USER').trim().toUpperCase();
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      role: role === 'ROLE_COLLECTOR' ? 'ROLE_COLLECTOR' : 'ROLE_USER',
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    db.userData[user.id] = defaultUserData();
    writeDb(db);

    const safeUser = sanitizeUser(user);
    const token = generateToken(user);

    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', authRateLimit, async (req, res) => {
  try {
    const email = (req.body?.email || '').trim().toLowerCase();
    const password = req.body?.password || '';

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const db = readDb();
    const user = db.users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = generateToken(user);
    return res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// FIX #5: Logout endpoint — blacklists the current token
app.post('/api/auth/logout', authMiddleware, (req, res) => {
  blacklistToken(req.authToken);
  return res.json({ ok: true, message: 'Logged out successfully' });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: sanitizeUser(user) });
});

// --- User Data ---
app.get('/api/data/me', authMiddleware, (req, res) => {
  const db = readDb();
  const data = db.userData[req.userId] || defaultUserData();
  return res.json({ data });
});

app.put('/api/data/me', authMiddleware, (req, res) => {
  const incoming = req.body?.data;
  if (!incoming || typeof incoming !== 'object') {
    return res.status(400).json({ error: 'Missing data payload' });
  }

  const cleanData = sanitizeIncomingData(incoming);

  const db = readDb();
  db.userData[req.userId] = cleanData;
  writeDb(db);

  return res.json({ data: cleanData });
});

// --- SustainAI History ---
app.get('/api/sustainai/history', authMiddleware, (req, res) => {
  const db = readDb();
  const userData = db.userData[req.userId] || defaultUserData();
  const history = Array.isArray(userData.aiHistory) ? userData.aiHistory : [];
  res.json({ messages: history });
});

app.post('/api/sustainai/history', authMiddleware, (req, res) => {
  const incoming = req.body?.messages;
  if (!Array.isArray(incoming)) return res.status(400).json({ error: 'Missing messages array' });
  const db = readDb();
  if (!db.userData[req.userId]) db.userData[req.userId] = defaultUserData();
  // Strip base64 image data from history to prevent DB bloat
  const cleanedMessages = incoming.map(msg => ({
    id: msg.id,
    role: msg.role,
    content: msg.content,
    mimeType: msg.mimeType || undefined
    // Intentionally omit msg.image (base64) to save space
  }));
  db.userData[req.userId].aiHistory = cleanedMessages;
  writeDb(db);
  res.json({ ok: true });
});

app.delete('/api/sustainai/history/:id', authMiddleware, (req, res) => {
  const db = readDb();
  if (!db.userData[req.userId]) return res.json({ ok: true });
  const history = db.userData[req.userId].aiHistory || [];
  db.userData[req.userId].aiHistory = history.filter(msg => msg.id !== req.params.id);
  writeDb(db);
  res.json({ ok: true });
});

app.delete('/api/sustainai/history', authMiddleware, (req, res) => {
  const db = readDb();
  if (!db.userData[req.userId]) db.userData[req.userId] = defaultUserData();
  db.userData[req.userId].aiHistory = [];
  writeDb(db);
  res.json({ ok: true });
});

// --- AI Chat ---
app.post('/api/chat', authMiddleware, chatRateLimit, async (req, res) => {
  try {
    if (!ai) {
      return res.status(500).json({ error: 'AI is not configured. Missing GEMINI_API_KEY.' });
    }
    const messages = req.body.messages;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // FIX #7: Normalize messages to ensure proper role alternation
    const contentsArray = normalizeContentsForGemini(messages);

    let response;
    try {
        response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: SYSTEM_PROMPT
            },
            contents: contentsArray
        });
    } catch (e) {
        if (e.status === 503 || e.message?.includes('high demand')) {
            console.log('gemini-2.5-flash is experiencing high demand, retrying...');
            response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: SYSTEM_PROMPT
                },
                contents: contentsArray
            });
        } else {
            throw e;
        }
    }

    res.json({ reply: response.text });
  } catch (err) {
    console.error('AI Chat Error:', err.message || err);
    const status = err.status || err.httpCode || 500;
    res.status(status >= 400 && status < 600 ? status : 500).json({
      error: err.message || 'Sorry, I encountered an internal error while processing your request.'
    });
  }
});

// --- Stats ---
app.get('/api/stats/global', (_req, res) => {
  const db = readDb();
  const all = Object.values(db.userData || {});

  const totalCredits = all.reduce((sum, d) => sum + (Number(d.credits) || 0), 0);
  const totalItems = all.reduce((sum, d) => sum + (Array.isArray(d.history) ? d.history.length : 0), 0);
  const totalRewards = all.reduce((sum, d) => sum + (Array.isArray(d.claimedRewards) ? d.claimedRewards.length : 0), 0);
  const co2Saved = Math.round(totalItems * 0.5);

  res.json({
    totalUsers: db.users.length,
    totalCredits,
    totalItems,
    totalRewards,
    co2Saved
  });
});

// --- Leaderboard ---
app.get('/api/leaderboard', (req, res) => {
  const db = readDb();
  const requestedLimit = Number.parseInt(req.query.limit, 10);
  const limit = Number.isFinite(requestedLimit) && requestedLimit > 0
    ? Math.min(requestedLimit, 100)
    : 10;

  const rows = db.users
    .map((user) => {
      const data = db.userData[user.id] || defaultUserData();
      const scans = Array.isArray(data.history) ? data.history.length : 0;
      const credits = Number(data.credits) || 0;
      const badges = Array.isArray(data.badges) ? data.badges : [];
      const topBadge = badges.length ? String(badges[badges.length - 1]) : 'Eco Starter';

      return {
        id: user.id,
        name: user.name || 'Anonymous',
        scans,
        credits,
        badge: topBadge,
        createdAt: user.createdAt || null
      };
    })
    .sort((a, b) => {
      if (b.credits !== a.credits) return b.credits - a.credits;
      if (b.scans !== a.scans) return b.scans - a.scans;
      return (a.createdAt || '').localeCompare(b.createdAt || '');
    })
    .map((entry, idx) => ({
      rank: idx + 1,
      id: entry.id,
      name: entry.name,
      scans: entry.scans,
      credits: entry.credits,
      badge: entry.badge
    }));

  res.json({
    totalUsers: rows.length,
    updatedAt: new Date().toISOString(),
    leaderboard: rows.slice(0, limit)
  });
});

// --- Content ---
app.get('/api/content/featured', (_req, res) => {
  const db = readDb();
  res.set('Cache-Control', 'public, max-age=120');
  res.json({
    updatedAt: new Date().toISOString(),
    items: db.content.featuredMedia
  });
});

// --- Community ---
function handleCommunityPostsGet(_req, res) {
  const db = readDb();
  const posts = Array.isArray(db.content?.communityPosts) ? db.content.communityPosts : [];
  const ordered = posts
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({
    updatedAt: new Date().toISOString(),
    total: ordered.length,
    posts: ordered.slice(0, 120)
  });
}

function handleCommunityPostsCreate(req, res) {
  const type = req.body?.type === 'story' ? 'story' : 'chat';
  const author = String(req.body?.author || '').trim();
  const text = String(req.body?.text || '').trim();
  const imageUrl = String(req.body?.imageUrl || '').trim();

  if (!author || !text) {
    return res.status(400).json({ error: 'Author and message are required' });
  }

  if (text.length < 3) {
    return res.status(400).json({ error: 'Message must be at least 3 characters' });
  }

  const db = readDb();
  const post = {
    id: crypto.randomUUID(),
    type,
    author: author.slice(0, 40),
    text: text.slice(0, 500),
    // FIX #9: Limit imageUrl to 2048 chars (standard URL max) instead of 2MB
    imageUrl: imageUrl.slice(0, 2048),
    createdAt: new Date().toISOString()
  };

  db.content.communityPosts.unshift(post);
  if (db.content.communityPosts.length > MAX_COMMUNITY_POSTS) {
    db.content.communityPosts = db.content.communityPosts.slice(0, MAX_COMMUNITY_POSTS);
  }
  writeDb(db);

  return res.status(201).json({ ok: true, post });
}

function handleCommunityPostsDelete(req, res) {
  const { id } = req.params;
  const author = req.query.author;
  
  if (!id || !author) {
    return res.status(400).json({ error: 'Post ID and author are required' });
  }

  const db = readDb();
  if (!db.content.communityPosts) {
    return res.status(404).json({ error: 'No posts found' });
  }

  const postIndex = db.content.communityPosts.findIndex(p => p.id === id);
  if (postIndex === -1) {
    return res.status(404).json({ error: 'Post not found' });
  }

  if (db.content.communityPosts[postIndex].author !== author) {
    return res.status(403).json({ error: 'Unauthorized to delete this post' });
  }

  db.content.communityPosts.splice(postIndex, 1);
  writeDb(db);
  
  return res.json({ ok: true, message: 'Post deleted successfully' });
}

app.get('/api/community/posts', handleCommunityPostsGet);
app.get('/community/posts', handleCommunityPostsGet);
app.delete('/api/community/posts/:id', handleCommunityPostsDelete);
app.delete('/community/posts/:id', handleCommunityPostsDelete);
// --- Community ---
// Rate limit for community posts: 10 per hour

// --- Pickups ---
app.post('/api/pickups', authMiddleware, async (req, res) => {
  try {
    const { address, material, weight, notes } = req.body;
    if (!address || !material || !weight) {
      return res.status(400).json({ error: 'Address, material, and weight are required.' });
    }
    const db = readDb();
    const user = db.users.find(u => u.id === req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const pickup = {
      id: crypto.randomUUID(),
      userId: user.id,
      userName: user.name,
      address,
      material,
      weight: parseFloat(weight),
      notes: notes || '',
      status: 'pending',
      collectorId: null,
      collectorName: null,
      creditsAwarded: false,
      createdAt: new Date().toISOString()
    };
    db.pickups.push(pickup);
    writeDb(db);
    res.status(201).json({ pickup });
  } catch (err) {
    console.error('Pickup create error:', err);
    res.status(500).json({ error: 'Failed to create pickup request' });
  }
});

app.get('/api/pickups', authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.role === 'ROLE_COLLECTOR') {
    // Collectors see all pending pickups + their accepted ones
    const available = db.pickups.filter(p => p.status === 'pending' || p.collectorId === user.id);
    return res.json({ pickups: available });
  } else {
    // Regular users see their own pickups
    const myPickups = db.pickups.filter(p => p.userId === user.id);
    return res.json({ pickups: myPickups });
  }
});

app.put('/api/pickups/:id/status', authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user || user.role !== 'ROLE_COLLECTOR') {
    return res.status(403).json({ error: 'Only collectors can update status' });
  }
  const pickup = db.pickups.find(p => p.id === req.params.id);
  if (!pickup) return res.status(404).json({ error: 'Pickup not found' });
  
  const newStatus = req.body.status;
  if (!['pending', 'accepted', 'completed'].includes(newStatus)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  pickup.status = newStatus;
  if (newStatus === 'accepted') {
    pickup.collectorId = user.id;
    pickup.collectorName = user.name;
  } else if (newStatus === 'completed' && !pickup.creditsAwarded) {
    if (!db.userData[pickup.userId]) db.userData[pickup.userId] = defaultUserData();
    if (!db.userData[pickup.collectorId]) db.userData[pickup.collectorId] = defaultUserData();

    db.userData[pickup.userId].credits = (db.userData[pickup.userId].credits || 0) + USER_COMPLETION_CREDITS;
    db.userData[pickup.collectorId].credits = (db.userData[pickup.collectorId].credits || 0) + COLLECTOR_COMPLETION_CREDITS;
    pickup.creditsAwarded = true;
  }
  
  writeDb(db);
  res.json({ pickup });
});

// --- Rewards ---
app.get('/api/rewards', authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const rewards = Array.isArray(db.content?.rewards) ? db.content.rewards : [];
  const availableRewards = rewards.filter(r => r.role === user.role);
  
  res.json({ rewards: availableRewards, credits: db.userData[user.id]?.credits || 0 });
});

app.post('/api/rewards/redeem', authMiddleware, (req, res) => {
  const { rewardId } = req.body;
  if (!rewardId) return res.status(400).json({ error: 'Reward ID is required' });

  const db = readDb();
  const user = db.users.find(u => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const rewards = Array.isArray(db.content?.rewards) ? db.content.rewards : [];
  const reward = rewards.find(r => r.id === rewardId && r.role === user.role);

  if (!reward) return res.status(404).json({ error: 'Reward not found or not available for your role' });
  if (!reward.inStock) return res.status(400).json({ error: 'Reward is out of stock' });

  let userData = db.userData[user.id];
  if (!userData) {
    userData = defaultUserData();
    db.userData[user.id] = userData;
  }

  if (userData.credits < reward.cost) {
    return res.status(400).json({ error: 'Insufficient credits' });
  }

  // Deduct credits and generate coupon code
  userData.credits -= reward.cost;
  const couponCode = crypto.randomBytes(4).toString('hex').toUpperCase() + '-' + crypto.randomBytes(4).toString('hex').toUpperCase();

  const claimedItem = {
    id: crypto.randomUUID(),
    rewardId: reward.id,
    title: reward.title,
    cost: reward.cost,
    couponCode,
    validUntil: new Date(Date.now() + COUPON_VALIDITY_DAYS * 24 * 60 * 60 * 1000).toISOString(),
    claimedAt: new Date().toISOString()
  };

  if (!Array.isArray(userData.claimedRewards)) userData.claimedRewards = [];
  userData.claimedRewards.push(claimedItem);

  writeDb(db);
  res.json({ success: true, couponCode, newBalance: userData.credits, claimedItem });
});

app.get('/api/rewards/history', authMiddleware, (req, res) => {
  const db = readDb();
  const userData = db.userData[req.userId] || defaultUserData();
  const history = Array.isArray(userData.claimedRewards) ? userData.claimedRewards : [];
  res.json({ history });
});

app.post('/api/community/posts', communityRateLimit, handleCommunityPostsCreate);
app.post('/community/posts', communityRateLimit, handleCommunityPostsCreate);

// --- Contact ---
app.post('/api/contact', contactRateLimit, (req, res) => {
  const name = (req.body?.name || '').trim();
  const email = (req.body?.email || '').trim().toLowerCase();
  const message = (req.body?.message || '').trim();

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required' });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address' });
  }

  if (message.length < 10) {
    return res.status(400).json({ error: 'Message must be at least 10 characters' });
  }

  const db = readDb();
  const contact = {
    id: crypto.randomUUID(),
    name,
    email,
    message,
    createdAt: new Date().toISOString()
  };

  db.contacts.unshift(contact);
  if (db.contacts.length > MAX_CONTACTS) {
    db.contacts = db.contacts.slice(0, MAX_CONTACTS);
  }
  writeDb(db);

  return res.status(201).json({ ok: true, message: 'Message received' });
});

// --- Phase 1 & 2 Proxy ---
  const phase2Proxy = createProxyMiddleware({ 
    target: 'http://localhost:3005', 
    changeOrigin: true,
    ws: true 
  });
  const phase1Proxy = createProxyMiddleware({ 
    target: 'http://localhost:3001', 
    changeOrigin: true,
    ws: true 
  });
  
  const phase2Routes = [
    '/admin-dashboard', 
    '/pickup-request-tracking', 
    '/collector-dashboard', 
    '/sign-up-login-screen'
  ];
  const phase1Routes = [
    '/dashboard',
    '/scan',
    '/marketplace',
    '/gallery',
    '/community',
    '/leaderboard',
    '/sustain-ai',
    '/chat-widget'
  ];

  app.use((req, res, next) => {
    // Route Next.js internal requests based on Referer
    if (req.path.startsWith('/_next') || req.path.startsWith('/__next')) {
      const referer = req.get('Referer');
      if (referer) {
        try {
          const url = new URL(referer);
          if (phase1Routes.some(route => url.pathname === route || url.pathname.startsWith(route + '/'))) {
            return phase1Proxy(req, res, next);
          }
        } catch (e) { /* ignore invalid referer */ }
      }
      return phase2Proxy(req, res, next);
    }

    // Explicit Phase 2 Routes
    if (phase2Routes.some(route => req.path === route || req.path.startsWith(route + '/'))) {
      return phase2Proxy(req, res, next);
    }

    // Explicit Phase 1 Routes
    if (phase1Routes.some(route => req.path === route || req.path.startsWith(route + '/'))) {
      return phase1Proxy(req, res, next);
    }

    next();
  });

// --- Static Files ---
app.use(express.static(__dirname));

// --- Explicit HTML Routes for clean URLs ---
app.get('/gallery-contact', (req, res) => res.sendFile(path.join(__dirname, 'gallery-contact.html')));
app.get('/goals-mission', (req, res) => res.sendFile(path.join(__dirname, 'goals-mission.html')));
app.get('/community-page', (req, res) => res.sendFile(path.join(__dirname, 'community.html')));
app.get('/impact', (req, res) => res.sendFile(path.join(__dirname, 'impact.html')));
app.get('/leaderboard-page', (req, res) => res.sendFile(path.join(__dirname, 'leaderboard.html')));

app.all('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});
  
  // ============================================================
  // FIX #10: Global Error Handlers
// ============================================================
process.on('uncaughtException', (err) => {
  console.error('[FATAL] Uncaught Exception:', err);
  flushDbSync();
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection at:', promise, 'reason:', reason);
  flushDbSync();
  process.exit(1);
});

// ============================================================
// FIX #8: Graceful Shutdown
// ============================================================
let isShuttingDown = false;

function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Shutdown] Received ${signal}. Flushing database...`);
  flushDbSync();
  console.log('[Shutdown] Goodbye!');
  process.exit(0);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// ============================================================
// Server Startup
// ============================================================
createStartupBackup();  // FIX #3
scanVerificationSessions = loadScanSessions(); // FIX #4
console.log(`[Boot] Loaded ${scanVerificationSessions.size} pending scan session(s) from disk.`);

app.listen(PORT, () => {
  console.log(`EcoSort server running on http://localhost:${PORT}`);
  console.log(`[Boot] Serving static Vanilla JS frontend (index.html)`);
  console.log(`[Boot] Rate limiting: auth=10/min, chat=20/min, community=5/min, contact=3/min`);
  console.log(`[Boot] Token blacklist active. Graceful shutdown enabled.`);
});
