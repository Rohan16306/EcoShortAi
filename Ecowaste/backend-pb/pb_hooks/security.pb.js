// Server-side validation to prevent privilege escalation during user signup
onRecordBeforeCreateRequest((e) => {
    const requestedRole = e.record.get("role");
    
    // The roles that public users are allowed to sign up as
    const allowedRoles = ["ROLE_USER", "ROLE_RECEIVER"];
    
    // If the requested role is not in the allowed list (e.g. ROLE_ADMIN)
    if (!allowedRoles.includes(requestedRole)) {
        // Check if an existing admin is making this request
        const admin = e.httpContext ? e.httpContext.get("authRecord") : null;
        
        if (!admin || admin.get("role") !== "ROLE_ADMIN") {
            // If not an admin, force the role back to a safe default
            console.log("Blocked unauthorized attempt to create account with role:", requestedRole);
            e.record.set("role", "ROLE_USER");
        }
    }
}, "users");
