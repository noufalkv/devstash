import { prisma } from "@/lib/prisma";

export interface SidebarUser {
  name: string | null;
  email: string;
  image: string | null;
}

export function getSidebarUser(userId: string): Promise<SidebarUser | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true, image: true },
  });
}
