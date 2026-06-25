const fs = require('fs');
const PB_URL = 'http://127.0.0.1:8090';

async function setupDb() {
    try {
        console.log("Authenticating as superuser...");
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: 'dev@system.com', password: 'superpassword123' })
        });
        const authData = await authRes.json();
        const token = authData.token;

        console.log("Fetching users collection...");
        const usersRes = await fetch(`${PB_URL}/api/collections/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const usersCol = await usersRes.json();
        
        // Add fields to users if missing
        let hasRole = false;
        for (const f of usersCol.schema) {
            if (f.name === 'role') hasRole = true;
        }
        
        if (!hasRole) {
            console.log("Adding 'role' to users...");
            usersCol.schema.push({ name: "role", type: "text", required: false, options: { min: 1, max: 20 } });
            usersCol.schema.push({ name: "is_active", type: "bool", required: false });
            usersCol.schema.push({ name: "total_points", type: "number", required: false, options: { min: 0 } });
            usersCol.schema.push({ name: "current_streak", type: "number", required: false, options: { min: 0 } });
            
            usersCol.updateRule = "@request.auth.id = id || @request.auth.role = 'ROLE_ADMIN'";
            usersCol.listRule = "id = @request.auth.id || @request.auth.role = 'ROLE_ADMIN'";
            usersCol.viewRule = "id = @request.auth.id || @request.auth.role = 'ROLE_ADMIN'";
            
            await fetch(`${PB_URL}/api/collections/users`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(usersCol)
            });
            console.log("Updated users collection.");
        }

        // Read pb_schema.json to create missing collections
        const schemaRaw = fs.readFileSync('backend-pb/pb_schema.json', 'utf8');
        const collections = JSON.parse(schemaRaw);
        
        for (const c of collections) {
            if (c.name === 'users') continue;
            
            const cRes = await fetch(`${PB_URL}/api/collections/${c.name}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (cRes.status === 404) {
                console.log(`Creating collection ${c.name}...`);
                const createRes = await fetch(`${PB_URL}/api/collections`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(c)
                });
                if (!createRes.ok) console.error(`Failed to create ${c.name}:`, await createRes.text());
                else console.log(`Created ${c.name}.`);
            } else if (cRes.ok) {
                // Update rules for existing collections
                const col = await cRes.json();
                col.listRule = c.listRule;
                col.viewRule = c.viewRule;
                await fetch(`${PB_URL}/api/collections/${c.name}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(col)
                });
            }
        }
        
        console.log("Database setup complete.");
    } catch (err) {
        console.error("Error:", err);
    }
}

setupDb();
