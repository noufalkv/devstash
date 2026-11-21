"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { isActivePath } from "@/lib/active-path";
import { cn } from "@/lib/utils";

interface SidebarSectionProps {
  title: string;
  contentClassName: string;
  children: React.ReactNode;
}

/** A collapsible sidebar section, open by default, with a chevron trigger. */
export function SidebarSection({ title, contentClassName, children }: SidebarSectionProps) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group/trigger flex w-full items-center justify-between py-1 text-sm font-medium text-muted-foreground hover:text-foreground">
        {title}
        <ChevronDown className="size-4 transition-transform group-aria-expanded/trigger:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className={contentClassName}>{children}</CollapsibleContent>
    </Collapsible>
  );
}

export const SIDEBAR_LINK_CLASS =
  "flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-muted";

const SIDEBAR_LINK_ACTIVE_CLASS = "bg-muted font-medium text-foreground";

interface SidebarLinkProps {
  href: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}

/** A sidebar link that is highlighted, with `aria-current="page"`, on its own route. */
export function SidebarLink({ href, onNavigate, children }: SidebarLinkProps) {
  const active = isActivePath(usePathname(), href);
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(SIDEBAR_LINK_CLASS, active && SIDEBAR_LINK_ACTIVE_CLASS)}
    >
      {children}
    </Link>
  );
}
