import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";
import { InviteForm } from "@/components/admin/InviteForm";
import { UserRowActions } from "@/components/admin/UserRowActions";
import { RevokeInviteButton } from "@/components/admin/RevokeInviteButton";
import { Badge } from "@/components/admin/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/admin/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/admin/ui/table";
import { auth } from "@/lib/auth";
import { listUsers, listActiveInvites, LIMITS } from "@/lib/admin/users";

export const metadata = { title: "Пользователи" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await auth();
  const meId = (session?.user as { id?: string }).id ?? "";

  const [users, invites] = await Promise.all([listUsers(), listActiveInvites()]);
  const remaining = LIMITS.MAX_USERS - users.length - invites.length;

  return (
    <AdminShell>
      <TopBar
        title="Пользователи"
        actions={
          <span className="text-xs text-muted-foreground">
            {users.length} / {LIMITS.MAX_USERS} · свободно {Math.max(0, remaining)}
          </span>
        }
      />
      <div className="flex-1 space-y-4 p-6">
        <div className="grid grid-cols-3 gap-4">
          <Stat label="Активных редакторов" value={users.length} />
          <Stat label="Приглашений в ожидании" value={invites.length} />
          <Stat label="Лимит" value={LIMITS.MAX_USERS} />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Редакторы</CardTitle>
            </CardHeader>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Логин</TableHead>
                  <TableHead>Роль</TableHead>
                  <TableHead>Создан</TableHead>
                  <TableHead>Последний вход</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium">{u.username}</div>
                          {u.name && <div className="text-xs text-muted-foreground">{u.name}</div>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={u.role === "owner" ? "default" : "secondary"}>
                        {u.role}
                        {u.id === meId && " · ты"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {u.lastLoginAt
                        ? u.lastLoginAt.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <UserRowActions id={u.id} isSelf={u.id === meId} isOwner={u.role === "owner"} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          <aside className="flex flex-col gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Пригласить редактора</CardTitle>
              </CardHeader>
              <CardContent>
                {remaining <= 0 ? (
                  <div className="rounded-md bg-warning/15 p-3 text-sm text-foreground">
                    Лимит {LIMITS.MAX_USERS} редакторов достигнут. Удали кого-то или отзови приглашение.
                  </div>
                ) : (
                  <InviteForm />
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Ожидающие приглашения</CardTitle>
              </CardHeader>
              <CardContent>
                {invites.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Приглашений нет.</p>
                ) : (
                  <ul className="flex flex-col divide-y">
                    {invites.map((i) => (
                      <li key={i.id} className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium">{i.label ?? "без комментария"}</div>
                          <div className="text-xs text-muted-foreground">
                            до {i.expiresAt.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                          </div>
                        </div>
                        <RevokeInviteButton id={i.id} />
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </AdminShell>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="text-2xl">{value}</CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
