import Cookies from 'js-cookie';

// Cookies are only sent over HTTPS in production and never on
// cross-site requests. Access tokens are short-lived; the refresh
// token cookie expires with the server's 7-day refresh window.
const baseOptions: Cookies.CookieAttributes = {
  sameSite: 'strict',
  secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
  path: '/',
};

export const getAccessToken = () => Cookies.get('accessToken');
export const getRefreshToken = () => Cookies.get('refreshToken');

export const setTokens = (accessToken: string, refreshToken?: string) => {
  Cookies.set('accessToken', accessToken, { ...baseOptions, expires: 1 });
  if (refreshToken) {
    Cookies.set('refreshToken', refreshToken, { ...baseOptions, expires: 7 });
  }
};

export const clearTokens = () => {
  Cookies.remove('accessToken', { path: '/' });
  Cookies.remove('refreshToken', { path: '/' });
};

/** Only allow redirects to paths inside this app (prevents open redirects). */
export const safeRedirectPath = (value: string | null | undefined, fallback = '/') =>
  value && value.startsWith('/') && !value.startsWith('//') ? value : fallback;
