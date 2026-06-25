const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3002;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-in-production';
const DB_PATH = path.join(__dirname, 'backend', 'data', 'db.json');
const MAX_HISTORY_ITEMS = 200;
const MAX_HASH_ITEMS = 200;
const MAX_COMMUNITY_POSTS = 300;
const MAX_CONTACTS = 500;
const SCAN_VERIFY_TTL_MS = 10 * 60 * 1000;
const STEP2_LOCATION_MAX_DISTANCE_METERS = 80;
const STEP2_LOCATION_MAX_TOLERANCE_METERS = 350;
let dbCache = null;
const scanVerificationSessions = new Map();

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
          content: {
            featuredMedia: defaultFeaturedMedia(),
            communityPosts: defaultCommunityPosts()
          }
        },
        null,
        2
      ),
      'utf8'
    );
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
      content: {
        featuredMedia: parsedFeatured.length >= fallbackFeatured.length ? parsedFeatured : fallbackFeatured,
        communityPosts: Array.isArray(parsed.content?.communityPosts)
          ? parsed.content.communityPosts
          : defaultCommunityPosts()
      }
    };

    const needsMigration =
      !Array.isArray(parsed.users) ||
      !(parsed.userData && typeof parsed.userData === 'object') ||
      !Array.isArray(parsed.contacts) ||
      !Array.isArray(parsed.content?.featuredMedia) ||
      !Array.isArray(parsed.content?.communityPosts);

    if (needsMigration) {
      fs.writeFileSync(DB_PATH, JSON.stringify(normalized, null, 2), 'utf8');
    }

    dbCache = normalized;
    return dbCache;
  } catch (err) {
    console.error('readDb error (using fallback):', err.message);
    // Return a safe in-memory fallback so the server stays up
    const fallback = {
      users: [],
      userData: {},
      contacts: [],
      content: {
        featuredMedia: defaultFeaturedMedia(),
        communityPosts: defaultCommunityPosts()
      }
    };
    dbCache = fallback;
    return dbCache;
  }
}

let writeScheduled = false;

function writeDb(db) {
  dbCache = db;
  if (!writeScheduled) {
    writeScheduled = true;
    setImmediate(async () => {
      writeScheduled = false;
      try {
        const data = JSON.stringify(dbCache, null, 2);
        await fs.promises.writeFile(DB_PATH, data, 'utf8');
      } catch (err) {
        console.error('Failed to write DB asynchronously:', err);
      }
    });
  }
}

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

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function extractUserIdFromAuth(req) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    return payload.sub || null;
  } catch (_err) {
    return null;
  }
}

function cleanupExpiredVerificationSessions() {
  const now = Date.now();
  for (const [id, session] of scanVerificationSessions.entries()) {
    if (!session || now - session.createdAt > SCAN_VERIFY_TTL_MS) {
      scanVerificationSessions.delete(id);
    }
  }
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

app.use(cors());
app.use(express.json({ limit: '3mb' }));

// Request timeout middleware — fail cleanly instead of hanging during stress tests
const REQUEST_TIMEOUT_MS = 15000;
app.use((req, res, next) => {
  req.setTimeout(REQUEST_TIMEOUT_MS);
  res.setTimeout(REQUEST_TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(503).json({ error: 'Request timed out' });
    }
  });
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, timestamp: new Date().toISOString() });
});

app.post('/api/scan/verify/start', (req, res) => {
  cleanupExpiredVerificationSessions();

  const photo = req.body?.photo;
  if (!photo || typeof photo !== 'object') {
    return res.status(400).json({ error: 'Missing photo scan payload' });
  }

  const verificationId = crypto.randomUUID();
  const userId = extractUserIdFromAuth(req);

  scanVerificationSessions.set(verificationId, {
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
  });

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

  const materialMatched = session.photo.material === String(step2.material || 'Other');
  const recyclableMatched = session.photo.isRecyclable === Boolean(step2.isRecyclable);
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

app.post('/api/auth/signup', async (req, res) => {
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
    const user = {
      id: crypto.randomUUID(),
      name,
      email,
      passwordHash,
      createdAt: new Date().toISOString()
    };

    db.users.push(user);
    db.userData[user.id] = defaultUserData();
    writeDb(db);

    const safeUser = sanitizeUser(user);
    const token = generateToken(user);

    return res.status(201).json({ user: safeUser, token });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
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
    return res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const db = readDb();
  const user = db.users.find((u) => u.id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  return res.json({ user: sanitizeUser(user) });
});

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

app.get('/api/content/featured', (_req, res) => {
  const db = readDb();
  res.set('Cache-Control', 'public, max-age=120');
  res.json({
    updatedAt: new Date().toISOString(),
    items: db.content.featuredMedia
  });
});

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
    imageUrl: imageUrl.slice(0, 2_000_000),
    createdAt: new Date().toISOString()
  };

  db.content.communityPosts.unshift(post);
  if (db.content.communityPosts.length > MAX_COMMUNITY_POSTS) {
    db.content.communityPosts = db.content.communityPosts.slice(0, MAX_COMMUNITY_POSTS);
  }
  writeDb(db);

  return res.status(201).json({ ok: true, post });
}

app.get('/api/community/posts', handleCommunityPostsGet);
app.get('/community/posts', handleCommunityPostsGet);
app.post('/api/community/posts', handleCommunityPostsCreate);
app.post('/community/posts', handleCommunityPostsCreate);

app.post('/api/contact', (req, res) => {
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

app.use(express.static(__dirname));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`EcoSort server running on http://localhost:${PORT}`);
});
