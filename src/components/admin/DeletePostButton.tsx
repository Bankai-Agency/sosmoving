"use client";

import { Trash2 } from "lucide-react";
import { removePost } from "@/app/(admin)/admin/content/actions";
import { Button } from "./ui/button";

export function DeletePostButton({ slug }: { slug: string }) {
  return (
    <form
      action={removePost}
      onSubmit={(e) => {
        if (!confirm("Удалить статью? Это действие необратимо.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <Button type="submit" variant="destructive" size="sm">
        <Trash2 className="h-3.5 w-3.5" />
        Удалить
      </Button>
    </form>
  );
}
