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
const oldTopLoad = `    const authRaw = typeof window !== 'undefined' ? getAuthCookie() : null;
    if (!authRaw) {
      router.push('/sign-up-login-screen');
      return;
    }
    
    let userPhone = '';
    let userName = '';
    try {
      const auth = JSON.parse(authRaw);
      userPhone = auth.phone || '';
      userName = auth.fullName || '';
    } catch { /* ignore */ }`;

const newTopLoad = `    const auth = session?.user as any;
    const userPhone = auth?.phone || '';
    const userName = auth?.name || '';`;
content = content.replace(oldTopLoad, newTopLoad);

// Replace getAuthCookie and authRaw inside onSubmit
const oldOnSubmit = `    const authRaw = getAuthCookie();
    const auth = authRaw ? JSON.parse(authRaw) : null;`;
const newOnSubmit = `    const auth = session?.user as any;`;
content = content.replace(oldOnSubmit, newOnSubmit);

// Clean up any remaining getAuthCookie imports
content = content.replace("import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';", "");

fs.writeFileSync(fullPath, content, 'utf8');
console.log('Fixed PickupRequestForm.tsx');
