import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { getItemDetail } from "@/lib/db/items";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const session = await auth();

  const item = await getItemDetail(id, session?.user?.id);
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json({ item });
}
