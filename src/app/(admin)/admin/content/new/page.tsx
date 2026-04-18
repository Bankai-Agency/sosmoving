import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { Button } from "@/components/admin/ui/button";
import { Input } from "@/components/admin/ui/input";
import { Label } from "@/components/admin/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { createPost } from "../actions";

export const metadata = { title: "Новая статья" };

export default function NewPostPage() {
  return (
    <AdminShell>
      <TopBar title="Новая статья" />
      <div className="flex-1 p-6">
        <Card className="mx-auto max-w-xl">
          <CardHeader>
            <CardTitle>Назови статью</CardTitle>
            <CardDescription>
              Из заголовка сгенерится slug. Потом откроется редактор — наполнишь содержимым и опубликуешь.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createPost} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="title">Заголовок</Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  autoFocus
                  placeholder="How to pack for a move without losing your mind"
                />
              </div>
              <Button type="submit" size="lg">
                Создать и открыть редактор →
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminShell>
  );
}
