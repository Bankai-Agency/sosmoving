import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { Button } from "@/components/admin/ui/button";
import { PageContentForm } from "@/components/admin/PageContentForm";
import { readPageHtml, pageHash } from "@/lib/admin/page-store";
import { extractSlots } from "@/lib/admin/page-slots";
import { classifyPage } from "@/lib/admin/pages";

export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  return { title: `Контент · ${slug}` };
}

export default async function EditPageContent({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const { type, url } = classifyPage(slug);
  // v1: the slot extractor is validated against city pages only.
  if (type !== "city" && type !== "movers-city") notFound();

  const html = await readPageHtml(slug);
  if (html === null) notFound();

  const slots = extractSlots(html);

  return (
    <AdminShell>
      <TopBar
        title={`Контент: ${url}`}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/pages">
                <ArrowLeft className="mr-1 h-4 w-4" /> Все страницы
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={url} target="_blank" rel="noopener noreferrer">
                Открыть на сайте <ExternalLink className="ml-1 h-4 w-4" />
              </a>
            </Button>
          </div>
        }
      />
      <div className="flex-1 p-6">
        <PageContentForm
          slug={slug}
          baseHash={pageHash(html)}
          heroH1={slots.heroH1 ? slots.heroH1.lines : null}
          heroSubtitle={slots.heroSubtitle ? slots.heroSubtitle.text : null}
          faq={slots.faq.map(({ q, a }) => ({ q, a }))}
          images={slots.images.map(({ src, alt }) => ({ src, alt }))}
        />
      </div>
    </AdminShell>
  );
}
