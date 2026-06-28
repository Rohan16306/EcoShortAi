'use client';

import { useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function AuthBridge() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const pbToken = searchParams.get('pb_token');

    if (pbToken) {
      const verifyToken = async () => {
        try {
          const result = await signIn('credentials', {
            pbToken,
            redirect: false,
          });

          if (result?.error) {
            console.error('AuthBridge: Token verification failed.', result.error);
          }
        } catch (error) {
          console.error('AuthBridge: Error verifying token.', error);
        } finally {
          router.replace(pathname);
        }
      };

      verifyToken();
    }
  }, [searchParams, pathname, router]);

  return null;
}
