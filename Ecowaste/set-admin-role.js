const PB_URL = 'http://127.0.0.1:8090';

async function setAdminRole() {
    try {
        const authRes = await fetch(`${PB_URL}/api/admins/auth-with-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identity: 'dev@system.com', password: 'superpassword123' })
        });
        const token = (await authRes.json()).token;

        const usersRes = await fetch(`${PB_URL}/api/collections/users/records?filter=email='rohanipawar16@gmail.com'`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const users = await usersRes.json();
        
        if (users.items.length > 0) {
            const userId = users.items[0].id;
            const patchRes = await fetch(`${PB_URL}/api/collections/users/records/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: 'ROLE_ADMIN' })
            });
            console.log("Updated role to ROLE_ADMIN:", await patchRes.json());
        } else {
            console.log("User rohanipawar16@gmail.com not found!");
        }
    } catch (err) {
        console.error("Error:", err);
    }
}
setAdminRole();
