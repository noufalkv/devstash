/** Whether a nav link to `href` is the current route: an exact match or a sub-path of it. */
export function isActivePath(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  return path === href || path.startsWith(`${href}/`);
}
