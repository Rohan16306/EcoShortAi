// seed-admin.js — Seeds the default Admin account into PocketBase
// Run: node backend-pb/seed-admin.js
// Make sure PocketBase is running on port 8090 first!

const PB_URL = 'http://127.0.0.1:8090';

const ADMIN_EMAIL = 'rohanipawar16@gmail.com';
const ADMIN_PASSWORD = '12344321';
const ADMIN_NAME = 'Admin';
const ADMIN_ROLE = 'ROLE_ADMIN';

async function seedAdmin() {
    console.log('[Seed] Checking if admin account exists...');

    try {
        // Check if account already exists by trying to login
        const loginRes = await fetch(`${PB_URL}/api/collections/users/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (loginRes.ok) {
            const data = await loginRes.json();
            if (data.record.role === ADMIN_ROLE) {
                console.log('[Seed] ✅ Admin account already exists with correct role. Nothing to do.');
                return;
            }
            // Account exists but wrong role — update it
            console.log('[Seed] Account exists but role is not ROLE_ADMIN. Updating...');
            const updateRes = await fetch(`${PB_URL}/api/collections/users/records/${data.record.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': data.token
                },
                body: JSON.stringify({ role: ADMIN_ROLE })
            });
            if (updateRes.ok) {
                console.log('[Seed] ✅ Admin role updated successfully!');
            } else {
                console.error('[Seed] ❌ Failed to update role:', await updateRes.text());
            }
            return;
        }

        // Account does not exist — create it
        console.log('[Seed] Creating admin account...');
        const createRes = await fetch(`${PB_URL}/api/collections/users/records`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: ADMIN_NAME,
                email: ADMIN_EMAIL,
                password: ADMIN_PASSWORD,
                passwordConfirm: ADMIN_PASSWORD,
                role: ADMIN_ROLE
            })
        });

        if (createRes.ok) {
            console.log(`[Seed] ✅ Admin account created successfully!`);
            console.log(`       Email: ${ADMIN_EMAIL}`);
            console.log(`       Role: ${ADMIN_ROLE}`);
        } else {
            const err = await createRes.json();
            console.error('[Seed] ❌ Failed to create admin:', JSON.stringify(err, null, 2));
        }
    } catch (err) {
        console.error('[Seed] ❌ Error:', err.message);
        console.error('       Make sure PocketBase is running: cd backend-pb && .\\pocketbase.exe serve');
    }
}

seedAdmin();
