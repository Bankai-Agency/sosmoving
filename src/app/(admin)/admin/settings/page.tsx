import { AdminShell } from "@/components/admin/AdminShell";
import { TopBar } from "@/components/admin/TopBar";

export const metadata = { title: "Настройки" };

export default function SettingsPage() {
  return (
    <AdminShell>
      <TopBar title="Настройки" />
      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* Main column */}
          <div className="flex flex-col gap-4 lg:col-span-2">
            {/* Profile */}
            <section className="rounded-xl bg-surface p-6">
              <h3 className="h6 mb-4 text-dark">Профиль</h3>
              <div className="flex flex-col gap-4">
                <Field label="Логин" value="capitalism" readOnly />
                <Field label="Имя" placeholder="Дмитрий" />
                <Field label="Email" placeholder="—" hint="Для сброса пароля (опционально)" />
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="h-10 rounded-md bg-dark px-4 text-[15px] font-semibold text-white transition-colors hover:bg-dark/90"
                >
                  Сохранить
                </button>
              </div>
            </section>

            {/* Password */}
            <section className="rounded-xl bg-surface p-6">
              <h3 className="h6 mb-4 text-dark">Смена пароля</h3>
              <div className="flex flex-col gap-4">
                <Field label="Текущий пароль" type="password" />
                <Field label="Новый пароль" type="password" />
                <Field label="Повторить новый" type="password" />
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="h-10 rounded-md bg-dark px-4 text-[15px] font-semibold text-white transition-colors hover:bg-dark/90"
                >
                  Сменить пароль
                </button>
              </div>
            </section>
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-4">
            <section className="rounded-xl bg-surface p-6">
              <h3 className="h6 mb-3 text-dark">Интеграции</h3>
              <ul className="flex flex-col gap-3">
                <Integration name="Vercel Analytics" status="pending" hint="нужен подключённый project" />
                <Integration name="Search Console" status="pending" hint="OAuth Google" />
                <Integration name="Sentry" status="pending" hint="DSN в env" />
                <Integration name="Cloudinary (картинки)" status="off" hint="решено: коммитим в git" />
              </ul>
            </section>

            <section className="rounded-xl bg-surface p-6">
              <h3 className="h6 mb-3 text-dark">Опасная зона</h3>
              <button
                type="button"
                className="h-10 w-full rounded-md border border-negative/32 bg-negative-soft px-4 text-[15px] font-semibold text-negative transition-colors hover:bg-negative hover:text-white"
                disabled
              >
                Запустить ручной ребилд
              </button>
              <p className="caption mt-2 text-dark/56">
                Триггерит deploy hook в Vercel — на случай если крон не сработал.
              </p>
            </section>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}

function Field({
  label,
  value,
  placeholder,
  hint,
  readOnly,
  type = "text",
}: {
  label: string;
  value?: string;
  placeholder?: string;
  hint?: string;
  readOnly?: boolean;
  type?: string;
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="caption text-dark/56">{label}</span>
      <input
        type={type}
        defaultValue={value}
        placeholder={placeholder}
        readOnly={readOnly}
        className="h-11 rounded-md border border-dark/12 bg-surface px-4 text-[15px] outline-none placeholder:text-dark/32 focus:border-dark read-only:bg-dark/6 read-only:text-dark/56"
      />
      {hint && <span className="caption text-dark/32">{hint}</span>}
    </label>
  );
}

function Integration({
  name,
  status,
  hint,
}: {
  name: string;
  status: "on" | "off" | "pending";
  hint: string;
}) {
  const dot =
    status === "on" ? "bg-positive" : status === "pending" ? "bg-warning" : "bg-dark/32";
  return (
    <li className="flex items-start gap-3">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot}`} />
      <div className="flex-1">
        <div className="p2 font-semibold text-dark">{name}</div>
        <div className="caption text-dark/56">{hint}</div>
      </div>
    </li>
  );
}
