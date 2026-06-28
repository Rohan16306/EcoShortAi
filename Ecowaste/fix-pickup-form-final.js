const fs = require('fs');
const path = require('path');

const file = 'Phase2/src/app/pickup-request-tracking/components/PickupRequestForm.tsx';
const fullPath = path.join(__dirname, file);
let content = fs.readFileSync(fullPath, 'utf8');

if (!content.includes("useSession")) {
    content = `import { useSession } from 'next-auth/react';\n` + content;
}

// 1. Move 'use client' to top if not already
if (content.includes("'use client';")) {
    content = content.replace("'use client';\n", "");
    content = `'use client';\n` + content;
}

// 2. Extract session at top of component
const componentStart = "export default function PickupRequestForm({ onSuccess }: { onSuccess: () => void }) {";
if (content.includes(componentStart) && !content.includes("const { data: session } = useSession();")) {
    content = content.replace(
        componentStart, 
        `${componentStart}\n  const { data: session } = useSession();`
    );
}

// 3. Remove old auth load block
const topRegex = /const authRaw = typeof window !== 'undefined' \? getAuthCookie\(\) : null;[\s\S]*?\} catch \{ \/\* ignore \*\/ \}/;
const newTopLoad = `const auth = session?.user as any;
    const userPhone = auth?.phone || '';
    const userName = auth?.name || '';`;
content = content.replace(topRegex, newTopLoad);

// 4. Replace inside onSubmit
const onSubmitRegex = /const authRaw = getAuthCookie\(\);\n\s*const auth = authRaw \? JSON\.parse\(authRaw\) : null;/;
const newOnSubmit = `const auth = session?.user as any;`;
content = content.replace(onSubmitRegex, newOnSubmit);

// 5. Cleanup imports
content = content.replace(/import \{ getAuthCookie, setAuthCookie, removeAuthCookie \} from '@\/lib\/authStorage';\n/g, "");

fs.writeFileSync(fullPath, content, 'utf8');
console.log('Fixed PickupRequestForm.tsx');
