export const ITEMS_PER_PAGE = 21;
export const COLLECTIONS_PER_PAGE = 21;
export const DASHBOARD_COLLECTIONS_LIMIT = 6;
export const DASHBOARD_RECENT_ITEMS_LIMIT = 10;

export interface PageRequest {
  page: number;
  perPage: number;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
}

export type PageLink = number | "ellipsis";

/** A 1-based page number from a `?page=` value; anything invalid becomes page 1. */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value || !/^\d+$/.test(value)) return 1;
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/** Number of pages needed for `total` rows; at least 1 so an empty list still has a page. */
export function getPageCount(total: number, perPage: number): number {
  return Math.max(1, Math.ceil(total / perPage));
}

/** Prisma `skip`/`take` for a page. */
export function toSkipTake({ page, perPage }: PageRequest): {
  skip: number;
  take: number;
} {
  return { skip: (page - 1) * perPage, take: perPage };
}

/**
 * Page links to show: the first and last page, the current page and its neighbours,
 * with "ellipsis" for each gap of two or more pages. A gap of one page shows the page.
 */
export function getPageLinks(current: number, pageCount: number): PageLink[] {
  const shown = new Set([1, pageCount, current - 1, current, current + 1]);
  const pages = [...shown]
    .filter((page) => page >= 1 && page <= pageCount)
    .sort((a, b) => a - b);

  const links: PageLink[] = [];
  for (const page of pages) {
    const previous = links.at(-1);
    if (typeof previous === "number") {
      if (page - previous === 2) links.push(previous + 1);
      else if (page - previous > 2) links.push("ellipsis");
    }
    links.push(page);
  }
  return links;
}

/** `pathname` with `?page=N`, dropping the param for page 1. */
export function getPageHref(pathname: string, page: number): string {
  return page <= 1 ? pathname : `${pathname}?page=${page}`;
}
