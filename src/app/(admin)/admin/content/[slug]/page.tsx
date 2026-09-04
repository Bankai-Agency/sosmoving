import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EditorForm } from "@/components/admin/EditorForm";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { Button } from "@/components/admin/ui/button";
import { Alert } from "@/components/admin/ui/alert";
import { readPost, isPublic, isValidPostSlug } from "@/lib/admin/content-store";
import { publishNow, unpublish } from "../actions";

type Params = { slug: string };

export const dynamic = "force-dynamic";
// savePost / publishNow / unpublish make three serial GitHub calls each.
export const maxDuration = 60;

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  // No GitHub read here: the page itself reads the post, and a failing read
  // in generateMetadata would take the whole route down.
  return { title: `Редактор · ${slug}` };
}

export default async function EditPostPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { slug } = await params;
  if (!isValidPostSlug(slug)) notFound();
  const { error } = await searchParams;
  const actionError = Array.isArray(error) ? error[0] : error;

  let post = null;
  let loadError: string | null = null;
  try {
    post = await readPost(slug);
    if (!post) {
      // A just-created post can 404 for a moment (GitHub read-after-write
      // lag right after createPost's redirect) - retry once before giving up.
      await new Promise((r) => setTimeout(r, 1500));
      post = await readPost(slug);
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "GitHub недоступен";
  }
  if (loadError) {
    return (
      <AdminShell>
        <TopBar title={slug} />
        <div className="p-6">
          <Alert variant="destructive">
            Не удалось прочитать статью из GitHub: {loadError}. Обновите страницу через минуту.
          </Alert>
        </div>
      </AdminShell>
    );
  }
  if (!post) notFound();

  const fm = post.frontmatter;
  const status: "published" | "draft" | "scheduled" = fm.draft
    ? fm.publishAt && new Date(fm.publishAt) > new Date()
      ? "scheduled"
      : "draft"
    : "published";
  const publiclyVisible = isPublic(fm);

  return (
    <AdminShell>
      <TopBar
        title={fm.title || slug}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge status={status} />
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/content">
                <ArrowLeft className="h-3.5 w-3.5" />
                К списку
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href={`/preview/blog/${slug}`} target="_blank">
                <Eye className="h-3.5 w-3.5" />
                Превью как на сайте
              </Link>
            </Button>
            {publiclyVisible && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/blog/${slug}`} target="_blank">
                  <ExternalLink className="h-3.5 w-3.5" />
                  На сайте
                </Link>
              </Button>
            )}
            {status !== "published" && (
              <form action={publishNow}>
                <input type="hidden" name="slug" value={slug} />
                <Button type="submit" size="sm" className="bg-positive text-positive-foreground hover:bg-positive/90">
                  Опубликовать сейчас
                </Button>
              </form>
            )}
            {status === "published" && (
              <form action={unpublish}>
                <input type="hidden" name="slug" value={slug} />
                <Button type="submit" variant="outline" size="sm">
                  Снять с публикации
                </Button>
              </form>
            )}
            <DeletePostButton slug={slug} />
          </div>
        }
      />
      <div className="flex-1 space-y-4 p-6">
        {actionError && <Alert variant="destructive">{actionError}</Alert>}
        <EditorForm slug={slug} frontmatter={fm} content={post.content} />
      </div>
    </AdminShell>
  );
}
