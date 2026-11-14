"use client";

import Link from "next/link";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";

import { signOutUser } from "@/actions/auth";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { SidebarUser } from "@/lib/db/users";

interface SidebarUserMenuProps {
  user: SidebarUser | null;
  onNavigate?: () => void;
}

/** Sidebar footer: the signed-in user linking to /profile, and a menu with "Settings" and "Sign out". */
export function SidebarUserMenu({ user, onNavigate }: SidebarUserMenuProps) {
  const displayName = user?.name ?? user?.email ?? "Guest";

  return (
    <div className="flex shrink-0 items-center gap-2.5 border-t border-border p-4">
      <Link
        href="/profile"
        onClick={onNavigate}
        aria-label="Profile"
        className="flex min-w-0 flex-1 items-center gap-2.5"
      >
        <UserAvatar name={displayName} image={user?.image} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{displayName}</p>
          {user && (
            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
          )}
        </div>
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" aria-label="User menu" />}
        >
          <ChevronsUpDown className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent side="top" align="end" className="w-40">
          <DropdownMenuItem render={<Link href="/settings" />} onClick={onNavigate}>
            <Settings className="size-4" />
            Settings
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => signOutUser()}>
            <LogOut className="size-4" />
            Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
