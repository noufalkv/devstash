import Link from "next/link";

import { FOOTER_COLUMNS, HOME_CONTAINER } from "@/components/homepage/content";
import { FooterYear } from "@/components/homepage/footer-year";
import { Logo } from "@/components/homepage/logo";

export function HomeFooter() {
  return (
    <footer className="border-t border-border bg-card/40 pt-14 pb-7 text-sm">
      <div className={`${HOME_CONTAINER} grid grid-cols-2 gap-8 md:grid-cols-[2fr_1fr_1fr]`}>
        <div className="col-span-2 md:col-span-1">
          <Logo />
          <p className="mt-3 max-w-70 text-muted-foreground">
            A unified hub for developer knowledge and resources.
          </p>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title} className="grid content-start gap-2.5">
            <h2 className="mb-1 text-[13px] tracking-wider text-muted-foreground uppercase">
              {column.title}
            </h2>
            {column.links.map((link) => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-type-snippet">
                {link.label}
              </Link>
            ))}
          </nav>
        ))}
      </div>
      <div className={`${HOME_CONTAINER} mt-10`}>
        <p className="border-t border-border pt-5 text-muted-foreground">
          &copy; <FooterYear /> DevStash. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
