'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

/**
 * AuthBridge — Reads auth data from URL query params and saves to localStorage.
 * 
 * When the main EcoSort site redirects to Phase 2 on a different domain (Vercel),
 * localStorage is not shared. So the main site encodes the auth data as URL params:
 *   ?auth_id=xxx&auth_email=xxx&auth_name=xxx&auth_role=xxx
 * 
 * This component reads those params, saves them to localStorage as `wastepickup_auth`,
 * then cleans the URL by removing the query params.
 */
export default function AuthBridge() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const authId = searchParams.get('auth_id');
    const authEmail = searchParams.get('auth_email');
    const authName = searchParams.get('auth_name');
    const authRole = searchParams.get('auth_role');

    if (authId && authEmail && authRole) {
      // Save auth to localStorage (same format Phase 2 expects)
      const authData = {
        id: authId,
        email: authEmail,
        fullName: authName || 'User',
        role: authRole, // 'admin', 'collector', or 'user'
      };
      localStorage.setItem('wastepickup_auth', JSON.stringify(authData));

      // Clean up URL — remove auth params but keep the path
      const cleanUrl = pathname;
      router.replace(cleanUrl);
    }
  }, [searchParams, pathname, router]);

  return null; // This component renders nothing
}
