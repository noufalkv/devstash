import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { isFileItemType, resolveContentType, validateFile } from "@/lib/file-upload";
import { buildFileKey, uploadToR2 } from "@/lib/r2";
import { canUseProFeature } from "@/lib/usage-limits";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Checked before reading the body, so free users never stream a file to the server
  if (!canUseProFeature(session.user.isPro)) {
    return NextResponse.json(
      { error: "File and image uploads are a Pro feature" },
      { status: 403 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const type = formData.get("type");
  const file = formData.get("file");
  if (!isFileItemType(type) || !(file instanceof File)) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }

  const error = validateFile(type, file);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const key = buildFileKey(session.user.id, file.name);
  try {
    await uploadToR2(key, Buffer.from(await file.arrayBuffer()), resolveContentType(type, file));
  } catch {
    return NextResponse.json({ error: "Upload failed. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ key, name: file.name, size: file.size });
}
