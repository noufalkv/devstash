import { redirect } from "next/navigation";
import { FolderOpen, LayoutGrid } from "lucide-react";

import { auth } from "@/auth";
import { ProfileInfo } from "@/components/profile/profile-info";
import { TypeBreakdown } from "@/components/profile/type-breakdown";
import { StatCard } from "@/components/dashboard/stat-card";
import { getUserItemTypeCounts } from "@/lib/db/items";
import { getProfile } from "@/lib/db/users";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in?callbackUrl=/profile");

  const [profile, itemTypes] = await Promise.all([
    getProfile(session.user.id),
    getUserItemTypeCounts(session.user.id),
  ]);
  if (!profile) redirect("/sign-in");

  return (
    <>
      <h1 className="text-3xl font-semibold">Profile</h1>
      <ProfileInfo profile={profile} />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Usage</h2>
        <div className="grid grid-cols-2 gap-4">
          <StatCard label="Items" value={profile.itemCount} icon={LayoutGrid} />
          <StatCard label="Collections" value={profile.collectionCount} icon={FolderOpen} />
        </div>
        <TypeBreakdown itemTypes={itemTypes} />
      </section>
    </>
  );
}
