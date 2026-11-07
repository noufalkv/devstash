import { Card, CardContent } from "@/components/ui/card";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { Profile } from "@/lib/db/users";

interface ProfileInfoProps {
  profile: Profile;
}

export function ProfileInfo({ profile }: ProfileInfoProps) {
  const displayName = profile.name ?? profile.email;
  const joined = profile.createdAt.toLocaleDateString("en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  });

  return (
    <Card>
      <CardContent className="flex items-center gap-4">
        <UserAvatar name={displayName} image={profile.image} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold">{displayName}</p>
          {profile.name && (
            <p className="truncate text-sm text-muted-foreground">{profile.email}</p>
          )}
          <p className="text-sm text-muted-foreground">Member since {joined}</p>
        </div>
      </CardContent>
    </Card>
  );
}
