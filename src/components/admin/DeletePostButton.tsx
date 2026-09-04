"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";
import { removePost } from "@/app/(admin)/admin/content/actions";
import { Button } from "./ui/button";

function SubmitButton() {
  // Disabled while the action runs: a double click used to send two
  // removePost calls, and the second one crashed the page.
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="destructive" size="sm" disabled={pending}>
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "…" : "Удалить"}
    </Button>
  );
}

export function DeletePostButton({ slug }: { slug: string }) {
  return (
    <form
      action={removePost}
      onSubmit={(e) => {
        if (!confirm("Удалить статью? Это действие необратимо.")) e.preventDefault();
      }}
    >
      <input type="hidden" name="slug" value={slug} />
      <SubmitButton />
    </form>
  );
}
