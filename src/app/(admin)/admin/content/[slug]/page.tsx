import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Eye } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { EditorForm } from "@/components/admin/EditorForm";
import { DeletePostButton } from "@/components/admin/DeletePostButton";
import { Button } from "@/components/admin/ui/button";
import { readPost, isPublic } from "@/lib/admin/content-store";
import { publishNow, unpublish } from "../actions";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await readPost(slug);
  return { title: post ? `Редактор · ${post.frontmatter.title}` : "Редактор" };
}

export default async function EditPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = await readPost(slug);
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
      <div className="flex-1 p-6">
        <EditorForm slug={slug} frontmatter={fm} content={post.content} />
      </div>
    </AdminShell>
  );
}
