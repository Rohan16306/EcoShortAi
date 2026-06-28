const fs = require('fs');
const path = require('path');

function replaceFileContent(filePath, replacer) {
    const fullPath = path.join(__dirname, filePath);
    if (fs.existsSync(fullPath)) {
        let content = fs.readFileSync(fullPath, 'utf8');
        content = replacer(content);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

// 1. CollectorDashboardScreen.tsx
replaceFileContent('Phase2/src/app/collector-dashboard/components/CollectorDashboardScreen.tsx', (content) => {
    content = content.replace("import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';", "import { useSession } from 'next-auth/react';");
    
    // Inject useSession
    content = content.replace("const router = useRouter();", "const router = useRouter();\n  const { data: session, status } = useSession();");
    
    // Fix auth parsing
    const oldAuthCheck = `if (status === 'unauthenticated') {
      router.replace('/sign-up-login-screen');
      return;
    }
    const auth = session?.user;
    try { auth = JSON.parse(authRaw); } catch { /* ignore */ }
    if (!auth || (auth.role !== 'collector' && auth.role !== 'ROLE_RECEIVER')) {`;
    
    const newAuthCheck = `if (status === 'unauthenticated') {
      router.replace('/sign-up-login-screen');
      return;
    }
    const auth = session?.user as any;
    if (!auth || (auth.role !== 'collector' && auth.role !== 'ROLE_RECEIVER')) {`;
    
    return content.replace(oldAuthCheck, newAuthCheck);
});

// 2. PickupTopBar.tsx
replaceFileContent('Phase2/src/app/pickup-request-tracking/components/PickupTopBar.tsx', (content) => {
    content = content.replace("import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';", "import { useSession } from 'next-auth/react';");
    content = content.replace("const [user, setUser] = useState<UserAuth | null>(null);", "const { data: session } = useSession();\n  const user = session?.user as UserAuth | null;");
    
    // Remove old manual loading
    const oldLoad = `    // Load user auth
    const raw = getAuthCookie();
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignore */ }
    }`;
    return content.replace(oldLoad, "");
});

// 3. RewardDashboard.tsx
replaceFileContent('Phase2/src/components/rewards/RewardDashboard.tsx', (content) => {
    content = content.replace("import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';", "import { useSession } from 'next-auth/react';");
    content = content.replace("const [userRole, setUserRole] = useState<string>('user');", "const { data: session } = useSession();\n  const userRole = session?.user?.role || 'user';");
    
    const oldLoad = `    const raw = getAuthCookie();
    if (raw) {
      try {
        const auth = JSON.parse(raw);
        setUserRole(auth.role || 'user');
        setUserId(auth.id);
      } catch { /* ignore */ }
    }`;
    return content.replace(oldLoad, "");
});

// 4. PortalEntry.tsx
replaceFileContent('Phase2/src/admin-portal/PortalEntry.tsx', (content) => {
    content = content.replace("import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';", "import { useSession } from 'next-auth/react';");
    content = content.replace("const router = useRouter();", "const router = useRouter();\n  const { data: session, status } = useSession();");
    
    const oldLoad = `    // Admin Auth Guard
    const authRaw = typeof window !== 'undefined' ? getAuthCookie() : null;
    if (!authRaw) {
      router.replace('/sign-up-login-screen');
      return;
    }
    
    try {
      const auth = JSON.parse(authRaw);
      if (auth.role !== 'admin') {
        router.replace('/sign-up-login-screen');
        return;
      }
      setAdminName(auth.fullName || 'Admin');
    } catch {
      router.replace('/sign-up-login-screen');
    }`;
    
    const newLoad = `    // Admin Auth Guard
    if (status === 'unauthenticated' || (session?.user as any)?.role !== 'admin') {
      router.replace('/sign-up-login-screen');
      return;
    }
    setAdminName(session?.user?.name || 'Admin');`;
    return content.replace(oldLoad, newLoad);
});

// 5. PickupRequestForm.tsx
replaceFileContent('Phase2/src/app/pickup-request-tracking/components/PickupRequestForm.tsx', (content) => {
    content = content.replace("import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';", "import { useSession } from 'next-auth/react';");
    content = content.replace("const router = useRouter();", "const router = useRouter();\n  const { data: session } = useSession();");
    
    const oldLoad = `    // Check auth
    const authRaw = typeof window !== 'undefined' ? getAuthCookie() : null;
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
    
    const newLoad = `    const userPhone = (session?.user as any)?.phone || '';
    const userName = session?.user?.name || '';`;
    
    return content.replace(oldLoad, newLoad);
});

console.log('Finished deep refactor of useSession.');
