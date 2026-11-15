import Link from "next/link";

import { LogoMark } from "@/components/shared/logo-mark";

export function Logo() {
  return (
    <Link href="/" aria-label="DevStash home" className="inline-flex items-center gap-2.5 text-[17px] font-bold">
      <LogoMark />
      <span>DevStash</span>
    </Link>
  );
}
