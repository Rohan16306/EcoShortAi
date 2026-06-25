// seed-community-schema.js — Creates the community_posts collection in PocketBase
// Run: node backend-pb/seed-community-schema.js

const PB_URL = 'http://127.0.0.1:8090';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'password1234';

async function seedCommunitySchema() {
    console.log('[Seed] Authenticating as admin...');

    try {
        const loginRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: ADMIN_EMAIL, password: ADMIN_PASSWORD })
        });

        if (!loginRes.ok) {
            console.error('[Seed] ❌ Failed to login as admin:', await loginRes.text());
            return;
        }

        const data = await loginRes.json();
        const token = data.token;

        console.log('[Seed] ✅ Authenticated successfully.');

        console.log('[Seed] Checking if community_posts collection exists...');
        const checkRes = await fetch(`${PB_URL}/api/collections/community_posts`, {
            method: 'GET',
            headers: { 'Authorization': token }
        });

        if (checkRes.ok) {
            console.log('[Seed] ✅ community_posts collection already exists.');
            return;
        }

        console.log('[Seed] Creating community_posts collection...');
        const createRes = await fetch(`${PB_URL}/api/collections`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            },
            body: JSON.stringify({
                name: 'community_posts',
                type: 'base',
                system: false,
                schema: [
                    {
                        system: false,
                        id: 'cp_type_field',
                        name: 'type',
                        type: 'select',
                        required: true,
                        presentable: false,
                        unique: false,
                        options: {
                            maxSelect: 1,
                            values: ['chat', 'story']
                        }
                    },
                    {
                        system: false,
                        id: 'cp_author_field',
                        name: 'author',
                        type: 'text',
                        required: true,
                        presentable: false,
                        unique: false,
                        options: {
                            min: null,
                            max: null,
                            pattern: ''
                        }
                    },
                    {
                        system: false,
                        id: 'cp_text_field',
                        name: 'text',
                        type: 'editor',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            convertUrls: false
                        }
                    },
                    {
                        system: false,
                        id: 'cp_image_field',
                        name: 'image',
                        type: 'file',
                        required: false,
                        presentable: false,
                        unique: false,
                        options: {
                            maxSelect: 1,
                            maxSize: 5242880,
                            mimeTypes: ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif', 'image/webp'],
                            thumbs: [],
                            protected: false
                        }
                    }
                ],
                listRule: '',
                viewRule: '',
                createRule: '',
                updateRule: '',
                deleteRule: '',
                options: {}
            })
        });

        if (createRes.ok) {
            console.log('[Seed] ✅ community_posts collection created successfully!');
        } else {
            console.error('[Seed] ❌ Failed to create collection:', await createRes.text());
        }

    } catch (err) {
        console.error('[Seed] ❌ Error:', err.message);
    }
}

seedCommunitySchema();
