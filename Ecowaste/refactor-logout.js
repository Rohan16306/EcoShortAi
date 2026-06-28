const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'Phase2/src/app/pickup-request-tracking/components/PickupTopBar.tsx',
    'Phase2/src/app/collector-dashboard/components/CollectorSidebar.tsx',
    'Phase2/src/admin-portal/PortalEntry.tsx'
];

filesToUpdate.forEach(file => {
    const filePath = path.join(__dirname, file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');

    // Add import if missing
    if (!content.includes("import { signOut }")) {
        content = content.replace(
            "import { useRouter } from 'next/navigation';",
            "import { useRouter } from 'next/navigation';\nimport { signOut } from 'next-auth/react';"
        );
    }

    // Replace removeAuthCookie with signOut()
    if (content.includes("removeAuthCookie()")) {
        content = content.replace(/if\s*\(typeof window !== 'undefined'\)\s*\{\s*removeAuthCookie\(\);\s*\}/g, "signOut({ callbackUrl: '/sign-up-login-screen' });");
        content = content.replace(/removeAuthCookie\(\);/g, "signOut({ callbackUrl: '/sign-up-login-screen' });");
        
        // Remove router.push('/sign-up-login-screen') since signOut handles it
        content = content.replace(/router\.push\(['"`]\/sign-up-login-screen['"`]\);?/g, "");
        content = content.replace(/router\.replace\(['"`]\/sign-up-login-screen['"`]\);?/g, "");
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
});
