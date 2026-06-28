// Seed default admin user on startup if it doesn't exist
onAfterBootstrap((e) => {
    try {
        if (!$app.dao().hasTable("_collections")) {
            console.log("Skipping admin seeding (tables not created yet)");
            return;
        }
        const adminEmail = "rohanipawar16@gmail.com";
        try {
            const record = $app.dao().findAuthRecordByEmail("users", adminEmail);
            record.set("role", "ROLE_ADMIN");
            record.set("is_active", true);
            $app.dao().saveRecord(record);
            console.log("Updated existing user to admin: " + adminEmail);
        } catch (err) {
            // Record not found, create it
            const collection = $app.dao().findCollectionByNameOrId("users");
            if (collection) {
                const record = new Record(collection);
                record.setUsername("admin_" + Date.now());
                record.setEmail(adminEmail);
                record.setPassword("12344321");
                record.set("name", "Rohan Admin");
                record.set("role", "ROLE_ADMIN");
                record.set("is_active", true);
                
                try {
                    $app.dao().saveRecord(record);
                    console.log("Seeded new admin user: " + adminEmail);
                } catch (saveErr) {
                    console.error("Failed to seed admin:", saveErr);
                }
            }
        }
    } catch (criticalErr) {
        console.error("Skipped admin seeding (tables likely not created yet):", criticalErr.message);
    }
});

// Custom Analytics Route for Admin Dashboard
routerAdd("GET", "/api/custom/admin/stats", (c) => {
    const user = c.get("authRecord");
    if (!user || user.get("role") !== "ROLE_ADMIN") {
        throw new ForbiddenError("Only admins can access this endpoint.");
    }
    
    let totalUsers = 0;
    let activeUsers = 0;
    let totalScans = 0;
    const matObj = {};

    try {
        totalUsers = $app.dao().db().newQuery("SELECT count(id) as count FROM users").one().getInt("count");
        activeUsers = $app.dao().db().newQuery("SELECT count(id) as count FROM users WHERE is_active = 1 OR is_active = true").one().getInt("count");
        totalScans = $app.dao().db().newQuery("SELECT count(id) as count FROM scans").one().getInt("count");
        
        const materialsQuery = $app.dao().db().newQuery("SELECT material, count(id) as count FROM scans GROUP BY material").all();
        
        for (let i = 0; i < materialsQuery.length; i++) {
            const row = materialsQuery[i];
            matObj[row.getString("material")] = row.getInt("count");
        }
    } catch (err) {
        console.error("Error fetching admin stats:", err);
        throw new BadRequestError("Failed to fetch statistics.");
    }
    
    return c.json(200, {
        total_users: totalUsers,
        active_users: activeUsers,
        total_scans: totalScans,
        scans_by_material: matObj
    });
});

// Audit Logging Trigger
onRecordBeforeUpdateRequest((e) => {
    // Only process users collection
    if (e.collection.name !== "users") return;

    // Only log if triggered by an HTTP request (meaning there's a context)
    if (!e.httpContext) return;

    const admin = e.httpContext.get("authRecord");
    if (!admin || admin.get("role") !== "ROLE_ADMIN") return;

    try {
        const original = $app.dao().findRecordById("users", e.record.id);
        const oldRole = original.get("role");
        const newRole = e.record.get("role");
        const oldActive = original.get("is_active");
        const newActive = e.record.get("is_active");

        let action = "";
        let details = {};

        if (oldRole !== newRole) {
            action = "UPDATE_ROLE";
            details = { old_role: oldRole, new_role: newRole };
        } else if (oldActive !== newActive) {
            action = newActive ? "RESTORE_USER" : "SOFT_DELETE_USER";
            details = { old_active: oldActive, new_active: newActive };
        }

        if (action) {
            const auditCollection = $app.dao().findCollectionByNameOrId("audit_logs");
            const auditRecord = new Record(auditCollection);
            auditRecord.set("admin_id", admin.id);
            auditRecord.set("action", action);
            auditRecord.set("target_id", e.record.id);
            auditRecord.set("details", details);
            $app.dao().saveRecord(auditRecord);
        }
    } catch (err) {
        console.error("Failed to process audit log:", err);
    }
}, "users");
