"use client";

import { ChevronDown } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

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
