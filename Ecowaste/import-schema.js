const fs = require('fs');
const PB_URL = 'http://127.0.0.1:8090';

async function importSchema() {
    try {
        console.log("Authenticating as superuser...");
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: 'dev@system.com', password: 'superpassword123' })
        });
        
        if (!authRes.ok) {
            console.error("Auth failed:", await authRes.text());
            return;
        }
        const authData = await authRes.json();
        const token = authData.token;

        console.log("Fetching existing collections...");
        const existRes = await fetch(`${PB_URL}/api/collections?perPage=500`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const existData = await existRes.json();
        const existingMap = {};
        for (const c of existData.items) {
            existingMap[c.name] = c.id;
        }

        console.log("Reading schema...");
        const schemaRaw = fs.readFileSync('backend-pb/pb_schema.json', 'utf8');
        const collections = JSON.parse(schemaRaw);

        // Inject IDs for existing collections to trigger UPDATE instead of CREATE
        for (const c of collections) {
            if (existingMap[c.name]) {
                c.id = existingMap[c.name];
            }
        }

        console.log("Importing collections...");
        const importRes = await fetch(`${PB_URL}/api/collections/import`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                collections: collections,
                deleteMissing: false
            })
        });

        if (importRes.ok) {
            console.log("Schema imported successfully!");
        } else {
            console.error("Import failed:", await importRes.text());
        }
    } catch (err) {
        console.error("Error:", err);
    }
}

importSchema();
