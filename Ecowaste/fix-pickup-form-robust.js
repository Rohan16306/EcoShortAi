const fs = require('fs');
const path = require('path');

const file = 'Phase2/src/app/pickup-request-tracking/components/PickupRequestForm.tsx';
const fullPath = path.join(__dirname, file);
let content = fs.readFileSync(fullPath, 'utf8');

// Ensure useSession is imported
if (!content.includes("import { useSession } from 'next-auth/react';")) {
    content = `import { useSession } from 'next-auth/react';\n` + content;
}

// Ensure session is extracted at the top level
if (!content.includes("const { data: session } = useSession();")) {
    content = content.replace("export default function PickupRequestForm({ onSuccess }: Props) {", "export default function PickupRequestForm({ onSuccess }: Props) {\n  const { data: session } = useSession();");
}

// Remove old getAuthCookie logic near the top
const topRegex = /const authRaw = typeof window !== 'undefined' \? getAuthCookie\(\) : null;[\s\S]*?\} catch \{ \/\* ignore \*\/ \}/;
const newTopLoad = `const auth = session?.user as any;
    const userPhone = auth?.phone || '';
    const userName = auth?.name || '';`;
content = content.replace(topRegex, newTopLoad);

// Replace getAuthCookie and authRaw inside onSubmit
const onSubmitRegex = /const authRaw = getAuthCookie\(\);\s*const auth = authRaw \? JSON\.parse\(authRaw\) : null;/;
const newOnSubmit = `const auth = session?.user as any;`;
content = content.replace(onSubmitRegex, newOnSubmit);

// Clean up any remaining getAuthCookie imports
content = content.replace(/import \{ getAuthCookie, setAuthCookie, removeAuthCookie \} from '@\/lib\/authStorage';/g, "");

fs.writeFileSync(fullPath, content, 'utf8');
console.log('Fixed PickupRequestForm.tsx');
