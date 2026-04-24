export const AUTH_COOKIE = 'ultraspark_admin_token';

export function getTokenFromCookie() {
  if (typeof document === 'undefined') return '';
  const token = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${AUTH_COOKIE}=`))
    ?.split('=')[1];
  return token ? decodeURIComponent(token) : '';
}

export function setTokenCookie(token: string) {
  if (typeof document === 'undefined') return;
  const isSecure = window.location.protocol === 'https:';
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=86400; samesite=strict${isSecure ? '; secure' : ''}`;
}

export function clearTokenCookie() {
  if (typeof document === 'undefined') return;
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=strict`;
}
