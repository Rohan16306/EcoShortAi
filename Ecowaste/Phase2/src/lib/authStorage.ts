// Utility to manage authentication securely via cookies instead of localStorage

export const getAuthCookie = (): string | null => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )wastepickup_auth=([^;]+)/);
  if (match && match[1]) {
    try {
      return decodeURIComponent(match[1]);
    } catch (e) {
      console.error('Failed to parse auth cookie', e);
      return null;
    }
  }
  return null;
};

export const setAuthCookie = (data: any): void => {
  if (typeof document === 'undefined') return;
  const secureValue = encodeURIComponent(typeof data === 'string' ? data : JSON.stringify(data));
  // Set cookie for 24 hours, accessible across the whole site, with Lax SameSite
  document.cookie = `wastepickup_auth=${secureValue}; path=/; max-age=86400; SameSite=Lax; Secure`;
};

export const removeAuthCookie = (): void => {
  if (typeof document === 'undefined') return;
  // Expire the cookie immediately
  document.cookie = 'wastepickup_auth=; path=/; max-age=0; SameSite=Lax; Secure';
};
