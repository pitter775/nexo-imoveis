export function getSafeRedirectPath(value: string | null | undefined) {
  const redirectPath = value?.trim() || '/';

  if (!redirectPath.startsWith('/') || redirectPath.startsWith('//')) {
    return '/';
  }

  return redirectPath === '/admin' ? '/' : redirectPath;
}
