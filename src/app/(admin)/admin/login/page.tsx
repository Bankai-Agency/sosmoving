import { Logo } from "@/components/admin/Logo";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata = { title: "Войти" };

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* Left — form */}
      <section className="flex flex-col justify-center px-6 py-12 sm:px-16 lg:px-24">
        <div className="mx-auto w-full max-w-[400px]">
          <div className="mb-12">
            <Logo />
          </div>

          <h1 className="mb-2 text-3xl font-semibold tracking-tight">Вход</h1>
          <p className="mb-10 text-sm text-muted-foreground">
            Введи логин и пароль — попадёшь в админку.
          </p>

          <LoginForm />
        </div>
      </section>

      {/* Right — marketing panel (hidden on mobile) */}
      <aside className="relative hidden bg-muted/40 lg:block">
        <div className="absolute inset-0 flex items-center justify-center p-12">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-semibold tracking-tight">Управляй контентом сайта</h2>
            <p className="text-sm text-muted-foreground">
              Пиши, планируй публикации, следи за состоянием страниц — всё в одном месте.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
