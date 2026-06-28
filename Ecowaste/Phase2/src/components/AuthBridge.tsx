'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { getAuthCookie, setAuthCookie, removeAuthCookie } from '@/lib/authStorage';


export default function AuthBridge() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const pbToken = searchParams.get('pb_token');

    if (pbToken) {
      // Verify token with PocketBase
      const verifyToken = async () => {
        try {
          const PRODUCTION_PB_URL = 'https://ecowaste-pocketbase.onrender.com';
          const pbUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
            ? 'http://localhost:8090' 
            : PRODUCTION_PB_URL;

          const res = await fetch(`${pbUrl}/api/collections/users/auth-refresh`, {
            method: 'POST',
            headers: {
              'Authorization': pbToken,
              'Content-Type': 'application/json'
            }
          });

          if (res.ok) {
            const data = await res.json();
            const user = data.record;
            
            // Map PocketBase roles to Phase 2 roles
            let phase2Role = 'user';
            if (user.role === 'ROLE_ADMIN') phase2Role = 'admin';
            else if (user.role === 'ROLE_RECEIVER') phase2Role = 'collector';

            const authData = {
              id: user.id,
              email: user.email,
              fullName: user.name || 'User',
              role: phase2Role,
            };
            
            setAuthCookie(authData);
          } else {
            console.error('AuthBridge: Token verification failed.');
          }
        } catch (error) {
          console.error('AuthBridge: Error verifying token.', error);
        } finally {
          // Clean up URL
          router.replace(pathname);
        }
      };

      verifyToken();
    }
  }, [searchParams, pathname, router]);

  return null;
}

