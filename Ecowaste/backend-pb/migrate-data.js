/**
 * Data Migration Script: db.json → PocketBase
 *
 * This script reads your existing backend/data/db.json and imports
 * users, scan history, community posts, and contacts into PocketBase.
 *
 * Usage:
 *   1. Start PocketBase: ./pocketbase serve
 *   2. Create an admin account in the Admin UI
 *   3. Import collections from pb_schema.json first
 *   4. Run: node migrate-data.js
 *
 * IMPORTANT: Run this ONCE. Running it twice will create duplicate records.
 */

const PocketBase = require('pocketbase/cjs');
const fs = require('fs');
const path = require('path');

const POCKETBASE_URL = 'http://127.0.0.1:8090';
const DB_JSON_PATH = path.join(__dirname, '..', 'backend', 'data', 'db.json');

// ─── You must set these to your PocketBase admin credentials ───
const ADMIN_EMAIL = 'admin@ecosort.ai';
const ADMIN_PASSWORD = 'your-admin-password-here';

async function migrate() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  EcoSort AI — Data Migration: db.json → PocketBase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // 1. Read the old db.json
  if (!fs.existsSync(DB_JSON_PATH)) {
    console.error(`❌ db.json not found at: ${DB_JSON_PATH}`);
    process.exit(1);
  }

  const raw = fs.readFileSync(DB_JSON_PATH, 'utf8');
  const db = JSON.parse(raw);
  console.log(`\n📂 Found db.json with:`);
  console.log(`   ${db.users?.length || 0} users`);
  console.log(`   ${db.contacts?.length || 0} contacts`);
  console.log(`   ${db.content?.communityPosts?.length || 0} community posts`);

  // 2. Connect to PocketBase as admin
  const pb = new PocketBase(POCKETBASE_URL);
  try {
    const authRes = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    if (!authRes.ok) throw new Error(await authRes.text());
    const authData = await authRes.json();
    pb.authStore.save(authData.token, authData.admin);
    console.log(`\n✅ Authenticated as admin`);
  } catch (err) {
    console.error(`\n❌ Failed to authenticate as admin. Make sure PocketBase is running and credentials are correct.`);
    console.error(`   Error: ${err.message}`);
    process.exit(1);
  }

  // 3. Migrate Users
  console.log(`\n📦 Migrating users...`);
  const userIdMap = {}; // old ID → new PocketBase ID
  let usersCreated = 0;
  let usersSkipped = 0;

  for (const user of (db.users || [])) {
    try {
      const userData = db.userData?.[user.id] || {};
      const record = await pb.collection('users').create({
        name: user.name || 'Anonymous',
        email: user.email,
        password: 'MigratedUser2024!', // Temporary password — users should reset
        passwordConfirm: 'MigratedUser2024!',
        total_points: userData.credits || 0,
        current_streak: 0,
        badges: userData.badges || [],
      });
      userIdMap[user.id] = record.id;
      usersCreated++;
      console.log(`   ✓ ${user.email} → ${record.id} (${userData.credits || 0} pts)`);
    } catch (err) {
      usersSkipped++;
      console.log(`   ⚠ Skipped ${user.email}: ${err.message}`);
    }
  }
  console.log(`   Created: ${usersCreated}, Skipped: ${usersSkipped}`);

  // 4. Migrate Scan History
  console.log(`\n📦 Migrating scan history...`);
  let scansCreated = 0;

  for (const [oldUserId, userData] of Object.entries(db.userData || {})) {
    const newUserId = userIdMap[oldUserId];
    if (!newUserId) continue;

    const history = userData.history || [];
    for (const scan of history) {
      try {
        await pb.collection('scans').create({
          user: newUserId,
          material: scan.material || 'Other',
          label: scan.name || 'Unknown',
          points_awarded: scan.credits || 0,
          is_duplicate: scan.isDuplicate || false,
          geo_lat: scan.geoTag?.lat || 0,
          geo_lng: scan.geoTag?.lng || 0,
          geo_accuracy: scan.geoTag?.accuracy || 0,
        });
        scansCreated++;
      } catch (err) {
        // Skip individual scan errors
      }
    }
  }
  console.log(`   Created: ${scansCreated} scans`);

  // 5. Migrate Community Posts
  console.log(`\n📦 Migrating community posts...`);
  let postsCreated = 0;

  for (const post of (db.content?.communityPosts || [])) {
    try {
      await pb.collection('community_posts').create({
        type: post.type || 'chat',
        author: post.author || 'Anonymous',
        text: post.text || '',
      });
      postsCreated++;
    } catch (err) {
      // Skip individual post errors
    }
  }
  console.log(`   Created: ${postsCreated} posts`);

  // 6. Migrate Contacts
  console.log(`\n📦 Migrating contacts...`);
  let contactsCreated = 0;

  for (const contact of (db.contacts || [])) {
    try {
      await pb.collection('contacts').create({
        name: contact.name,
        email: contact.email,
        message: contact.message,
      });
      contactsCreated++;
    } catch (err) {
      // Skip individual contact errors
    }
  }
  console.log(`   Created: ${contactsCreated} contacts`);

  // 7. Seed Featured Media
  console.log(`\n📦 Seeding featured media...`);
  const featuredItems = db.content?.featuredMedia || [];
  let mediaCreated = 0;

  for (const item of featuredItems) {
    try {
      await pb.collection('featured_media').create({
        type: item.type || 'image',
        title: item.title,
        description: item.description || '',
        src: item.src,
      });
      mediaCreated++;
    } catch (err) {
      // Skip duplicates
    }
  }
  console.log(`   Created: ${mediaCreated} media items`);

  // Summary
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ✅ Migration Complete!`);
  console.log(`  Users: ${usersCreated} | Scans: ${scansCreated} | Posts: ${postsCreated}`);
  console.log(`  Contacts: ${contactsCreated} | Media: ${mediaCreated}`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`\n⚠️  NOTE: All migrated users have the temporary password: MigratedUser2024!`);
  console.log(`   Users should reset their passwords after first login.\n`);
}

migrate().catch(console.error);
