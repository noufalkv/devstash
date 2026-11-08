import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemFile } from "@/lib/db/items";
import { getFromR2 } from "@/lib/r2";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const file = await getItemFile(id, session.user.id);
  if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });

  let object;
  try {
    object = await getFromR2(file.key);
  } catch {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
  if (!object) return NextResponse.json({ error: "File not found" }, { status: 404 });

  // ?inline=1 lets the drawer show image previews; everything else downloads
  const contentType = object.contentType ?? "application/octet-stream";
  const inline =
    new URL(request.url).searchParams.get("inline") === "1" &&
    contentType.startsWith("image/");
  const headers = new Headers({
    "Content-Type": contentType,
    "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(file.name)}`,
    "Cache-Control": "private, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
  });
  if (object.contentLength !== undefined) {
    headers.set("Content-Length", String(object.contentLength));
  }

  return new Response(object.body, { headers });
}
