import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";

import { auth } from "@/auth";
import { ButtonLink } from "@/components/homepage/button-link";
import { HOME_CONTAINER, SECTION_LINKS } from "@/components/homepage/content";
import { HomeNavShell } from "@/components/homepage/home-nav-shell";
import { Logo } from "@/components/homepage/logo";

export function HomeNav() {
  return (
    <HomeNavShell>
      <div className={`${HOME_CONTAINER} flex h-16 items-center gap-8`}>
        <Logo />
        <nav aria-label="Main" className="hidden gap-6 text-sm text-muted-foreground md:flex">
          {SECTION_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex gap-2">
          <Suspense fallback={<SignedOutActions />}>
            <NavActions />
          </Suspense>
        </div>
      </div>
    </HomeNavShell>
  );
}

/** Reads the session at request time so the rest of the page stays static. */
async function NavActions() {
  await connection();
  const session = await auth();
  if (!session?.user) return <SignedOutActions />;
  return <ButtonLink href="/dashboard">Dashboard</ButtonLink>;
}

function SignedOutActions() {
  return (
    <>
      <ButtonLink href="/sign-in" variant="ghost" className="max-md:hidden">
        Sign In
      </ButtonLink>
      <ButtonLink href="/register">Get Started</ButtonLink>
    </>
  );
}
