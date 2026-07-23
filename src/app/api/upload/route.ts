import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveImage } from "@/lib/admin/image-store";

/**
 * POST /api/upload
 *
 * Receives a multipart/form-data body with a single `file` field (matching
 * BlockNote's default FormData shape), saves it under public/images/blog/,
 * and returns { url }. BlockNote's `uploadFile` contract expects the URL
 * to come back as a plain string, so the response includes that as the
 * top-level `url` field — client code in Editor.tsx maps it to a string.
 *
 * Auth: requires a valid admin session. Unauthenticated callers get 401.
 */
export const runtime = "nodejs"; // sharp / Buffer / fs — Node runtime only

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const actor = (session.user as { username?: string }).username ?? "unknown";

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "expected multipart/form-data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "missing 'file' field" }, { status: 400 });
  }

  // Optional destination: "blog" (default, BlockNote) or "pages" (page
  // content editor). saveImage whitelists the value.
  const dir = typeof form.get("dir") === "string" ? String(form.get("dir")) : "blog";

  try {
    const result = await saveImage(file, actor, dir);
    return NextResponse.json(result);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
