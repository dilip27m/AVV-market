// Single place to change the app's name, tagline and URLs.
export const APP_NAME = 'CampusMart';
export const APP_TAGLINE = 'Buy and sell within your campus';
export const APP_DESCRIPTION =
  'The campus marketplace for students. Seniors leaving campus sell their stuff cheap — juniors grab great deals. Meet on campus, pay in cash or UPI.';

/** Public site URL, used for share links and Open Graph tags. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
