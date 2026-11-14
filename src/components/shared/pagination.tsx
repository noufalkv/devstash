import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { getPageHref, getPageLinks } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
  pathname: string;
  page: number;
  pageCount: number;
}

interface StepLinkProps {
  href: string | null;
  label: string;
  children: React.ReactNode;
}

// Prev/Next: a link when the page exists, a greyed-out placeholder otherwise
function StepLink({ href, label, children }: Readonly<StepLinkProps>) {
  const className = cn(buttonVariants({ variant: "ghost" }), "gap-1");

  if (!href) {
    return (
      <span
        aria-disabled="true"
        className={cn(className, "pointer-events-none opacity-50")}
      >
        {children}
      </span>
    );
  }

  return (
    <Link href={href} aria-label={label} className={className}>
      {children}
    </Link>
  );
}

export function Pagination({ pathname, page, pageCount }: Readonly<PaginationProps>) {
  if (pageCount <= 1) return null;

  const links = getPageLinks(page, pageCount);

  return (
    <nav aria-label="Pagination" className="flex justify-center pt-2">
      <ul className="flex flex-wrap items-center gap-1">
        <li>
          <StepLink
            href={page > 1 ? getPageHref(pathname, page - 1) : null}
            label="Previous page"
          >
            <ChevronLeft />
            <span className="hidden sm:inline">Prev</span>
          </StepLink>
        </li>

        {links.map((link, index) =>
          link === "ellipsis" ? (
            <li
              // Ellipses have no stable value; their position is unique
              key={`ellipsis-${index}`}
              aria-hidden="true"
              className="px-1 text-muted-foreground"
            >
              …
            </li>
          ) : (
            <li key={link}>
              <Link
                href={getPageHref(pathname, link)}
                aria-label={`Page ${link}`}
                aria-current={link === page ? "page" : undefined}
                className={buttonVariants({
                  variant: link === page ? "outline" : "ghost",
                  size: "icon",
                })}
              >
                {link}
              </Link>
            </li>
          ),
        )}

        <li>
          <StepLink
            href={page < pageCount ? getPageHref(pathname, page + 1) : null}
            label="Next page"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight />
          </StepLink>
        </li>
      </ul>
    </nav>
  );
}
