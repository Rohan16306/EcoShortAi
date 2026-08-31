onAfterBootstrap((e) => {
    try {
        if (!$app.dao().hasTable("users")) {
            console.log("Skipping API rules update (users table not created yet)");
            return;
        }
        // Update scans collection
        const scans = $app.dao().findCollectionByNameOrId("scans");
        // original listRule: "@request.auth.id = user && deleted_at = ''"
        scans.listRule = "@request.auth.id = user || @request.auth.role = 'ROLE_ADMIN'";
        scans.viewRule = "@request.auth.id = user || @request.auth.role = 'ROLE_ADMIN'";
        $app.dao().saveCollection(scans);
        console.log("Updated scans API rules for Admin access");

        // Update collection_requests collection
        const requests = $app.dao().findCollectionByNameOrId("collection_requests");
        // Make sure admins can list/view them all
        requests.listRule = "requester_id = @request.auth.id || receiver_id = @request.auth.id || status = 'PENDING' || @request.auth.role = 'ROLE_ADMIN'";
        requests.viewRule = "requester_id = @request.auth.id || receiver_id = @request.auth.id || status = 'PENDING' || @request.auth.role = 'ROLE_ADMIN'";
        $app.dao().saveCollection(requests);
        console.log("Updated collection_requests API rules for Admin access");
        
        // Update users collection list rule so admin can see users table
        const users = $app.dao().findCollectionByNameOrId("users");
        users.listRule = "id = @request.auth.id || @request.auth.role = 'ROLE_ADMIN'";
        users.viewRule = "id = @request.auth.id || @request.auth.role = 'ROLE_ADMIN'";
        $app.dao().saveCollection(users);
        console.log("Updated users API rules for Admin access");
        
    } catch (err) {
        console.error("Failed to update API rules:", err);
    }
});
