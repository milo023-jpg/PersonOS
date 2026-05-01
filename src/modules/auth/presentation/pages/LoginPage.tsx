import { useMemo, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../application/store/authStore';

type AuthMode = 'login' | 'register';

export default function LoginPage() {
  const location = useLocation();
  const { userId, isReady, isLoading, error, loginWithGoogle, loginWithEmailPassword, registerWithEmailPassword, loginAsDevUser, clearError } =
    useAuthStore();

  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fromPath = useMemo(() => {
    const state = location.state as { from?: { pathname?: string } } | null;
    return state?.from?.pathname ?? '/';
  }, [location.state]);

  if (isReady && userId) {
    return <Navigate to={fromPath} replace />;
  }

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearError();

    if (mode === 'login') {
      await loginWithEmailPassword(email.trim(), password);
      return;
    }

    await registerWithEmailPassword(email.trim(), password);
  }

  async function handleGoogleLogin() {
    clearError();
    await loginWithGoogle();
  }

  return (
    <div className="dark relative min-h-screen overflow-hidden bg-background text-text-primary">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(79,70,229,0.15),transparent_45%),radial-gradient(circle_at_100%_0%,rgba(34,197,94,0.1),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.2),transparent_50%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(129,140,248,0.22),transparent_50%),radial-gradient(circle_at_100%_0%,rgba(34,197,94,0.18),transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.35),transparent_55%)]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-10 md:px-10">
        <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr]">
          <section className="rounded-3xl border border-gray-200 bg-surface p-8 shadow-sm dark:border-white/10 md:p-12">
            <p className="inline-flex rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              PersonOS
            </p>
            <h1 className="mt-6 text-4xl font-black leading-tight text-text-primary md:text-5xl">Entra y organiza tu sistema personal</h1>
            <p className="mt-4 max-w-xl text-sm text-text-secondary md:text-base">
              Tu dashboard, tareas, habitos y contextos viven en un solo lugar. Inicia sesion para sincronizar tu espacio con Firebase Auth.
            </p>

            <div className="mt-8 grid gap-3 text-sm text-text-secondary">
              <div className="rounded-2xl border border-gray-200 bg-background px-4 py-3 dark:border-white/10">Acceso con Google para empezar en segundos.</div>
              <div className="rounded-2xl border border-gray-200 bg-background px-4 py-3 dark:border-white/10">Email y contrasena para quienes prefieren cuenta clasica.</div>
              <div className="rounded-2xl border border-gray-200 bg-background px-4 py-3 dark:border-white/10">Sesion persistente y rutas protegidas por usuario.</div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-surface p-6 shadow-sm dark:border-white/10 md:p-8">
            <div className="mb-6 flex rounded-2xl bg-background p-1 text-sm font-semibold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  clearError();
                }}
                className={`w-1/2 rounded-xl px-4 py-2 transition ${mode === 'login' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Iniciar sesion
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  clearError();
                }}
                className={`w-1/2 rounded-xl px-4 py-2 transition ${mode === 'register' ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary hover:text-text-primary'}`}
              >
                Crear cuenta
              </button>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading || !isReady}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-background px-4 py-3 text-sm font-semibold text-text-primary transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10"
            >
              <span className="text-base">G</span>
              Continuar con Google
            </button>

            {import.meta.env.DEV && (
              <button
                type="button"
                onClick={() => loginAsDevUser('dev-user-001')}
                disabled={isLoading || !isReady}
                className="mt-3 w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Entrar como usuario de pruebas (dev-user-001)
              </button>
            )}

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-text-secondary/70">
              <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
              o con email
              <span className="h-px flex-1 bg-gray-200 dark:bg-white/10" />
            </div>

            <form className="space-y-4" onSubmit={handleEmailSubmit}>
              <label className="block text-sm">
                <span className="mb-1.5 block font-semibold text-text-primary">Correo</span>
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 dark:border-white/10"
                />
              </label>

              <label className="block text-sm">
                <span className="mb-1.5 block font-semibold text-text-primary">Contrasena</span>
                <input
                  type="password"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  minLength={6}
                  required
                  className="w-full rounded-xl border border-gray-200 bg-background px-4 py-2.5 text-text-primary outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20 dark:border-white/10"
                />
              </label>

              {error && <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>}

              <button
                type="submit"
                disabled={isLoading || !isReady}
                className="w-full rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {mode === 'login' ? 'Entrar con email' : 'Crear cuenta'}
              </button>
            </form>

            <p className="mt-5 text-center text-xs text-text-secondary">
              Al continuar aceptas el uso de Firebase Authentication en este entorno.{' '}
              <Link to="/" className="font-semibold text-text-primary underline underline-offset-2">
                Ir al inicio
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
