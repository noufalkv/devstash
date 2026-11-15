import Link from "next/link";
import { Layers } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" aria-label="DevStash home" className="inline-flex items-center gap-2.5 text-[17px] font-bold">
      <span
        aria-hidden="true"
        className="grid size-7.5 place-items-center rounded-lg bg-linear-135 from-type-snippet to-type-prompt text-white"
      >
        <Layers className="size-4.5" />
      </span>
      <span>DevStash</span>
    </Link>
  );
}
