const fs = require('fs');
const path = require('path');

const replaceInFile = (file, replacements) => {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) return;
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add useSession import if missing
    if (!content.includes("useSession")) {
        content = `import { useSession } from 'next-auth/react';\n` + content;
    }
    
    for (const [target, replacement] of replacements) {
        content = content.split(target).join(replacement);
    }
    
    // Add useSession call if missing inside the component
    if (content.includes("useSession") && !content.includes("const { data: session }")) {
        // Find default export function
        content = content.replace(/(export default function \w+\([^)]*\)\s*\{)/, "$1\n  const { data: session } = useSession();");
    }

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${file}`);
}

// 1. CreditAnimation.tsx
replaceInFile('Phase2/src/components/ui/CreditAnimation.tsx', [
    [`let role = (session?.user as any)?.role || '';`, `let role = (session?.user as any)?.role || '';`],
]);

// 2. RewardDashboard.tsx
replaceInFile('Phase2/src/components/rewards/RewardDashboard.tsx', [
    [`const authRaw = getAuthCookie();`, `/* removed authRaw */`],
    [`if (authRaw) {`, `if (false) {`],
]);

// 3. PickupTopBar.tsx
replaceInFile('Phase2/src/app/pickup-request-tracking/components/PickupTopBar.tsx', [
    [`const raw = getAuthCookie();`, `const raw = null;`],
]);

// 4. PickupRequestTrackingScreen.tsx
replaceInFile('Phase2/src/app/pickup-request-tracking/components/PickupRequestTrackingScreen.tsx', [
    [`typeof window !== 'undefined' ? JSON.parse(getAuthCookie() || '{}').role === 'collector' ? 'Collector' : 'User' : 'User'`, `((session?.user as any)?.role === 'collector' || (session?.user as any)?.role === 'ROLE_RECEIVER') ? 'Collector' : 'User'`],
]);

// 5. PickupRequestForm.tsx
replaceInFile('Phase2/src/app/pickup-request-tracking/components/PickupRequestForm.tsx', [
    [`const authRaw = getAuthCookie();`, `/* removed authRaw */`],
    [`if (authRaw) {`, `if (false) {`],
]);

// 6. CollectorDashboard.tsx
replaceInFile('Phase2/src/app/collector-dashboard/components/CollectorDashboard.tsx', [
    [`const authRaw = typeof window !== 'undefined' ? getAuthCookie() : null;`, `const authRaw = null;`],
]);

