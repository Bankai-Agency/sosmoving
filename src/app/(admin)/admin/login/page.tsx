import { Logo } from "@/components/admin/Logo";

export const metadata = { title: "Войти" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* Left — form */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-12 [&_span]:!text-dark [&_span_span]:!text-dark/56">
            <Logo />
          </div>

          <h1 className="h2 mb-10 text-dark">Вход</h1>

          {/*
            Form is static for this step — POST handler will land in the next
            commit (Auth.js credentials + /api/auth routes). Kept as plain
            HTML inputs now so the visual shell can be reviewed first.
          */}
          <form className="flex flex-col gap-4" action="/api/auth/callback/credentials" method="post">
            <label className="flex flex-col gap-2">
              <span className="caption text-dark/56">Логин</span>
              <input
                name="username"
                type="text"
                autoComplete="username"
                required
                className="h-12 rounded-md border border-dark/12 bg-surface px-4 text-[15px] leading-5 outline-none placeholder:text-dark/32 focus:border-dark"
                placeholder="your-login"
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="caption text-dark/56">Пароль</span>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="h-12 rounded-md border border-dark/12 bg-surface px-4 text-[15px] leading-5 outline-none placeholder:text-dark/32 focus:border-dark"
                placeholder="••••••••"
              />
            </label>

            <button
              type="submit"
              className="mt-4 h-12 rounded-md bg-dark px-4 text-[15px] font-semibold text-white transition-colors hover:bg-dark/90"
            >
              Продолжить
            </button>
          </form>
        </div>
      </section>

      {/* Right — illustration placeholder; matches ENOT layout */}
      <aside className="relative hidden bg-app lg:block">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h2 className="h3 mb-4 text-dark">Управляй контентом сайта</h2>
            <p className="p1 text-dark/56">
              Пиши, планируй публикации, следи за состоянием страниц — всё в одном месте.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
