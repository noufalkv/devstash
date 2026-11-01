import { DEMO_USER_EMAIL } from "@/lib/db/demo-user";
import { prisma } from "@/lib/prisma";

export interface SidebarUser {
  name: string | null;
  email: string;
}

export function getSidebarUser(): Promise<SidebarUser | null> {
  return prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { name: true, email: true },
  });
}
