import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface UserAvatarProps {
  name: string | null;
  image?: string | null;
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function UserAvatar({ name, image, size, className }: UserAvatarProps) {
  const label = name ?? "User";

  return (
    <Avatar size={size} className={className}>
      {image && <AvatarImage src={image} alt={label} />}
      <AvatarFallback>{getInitials(label)}</AvatarFallback>
    </Avatar>
  );
}
