export default function AuthRequiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-lg rounded-3xl border border-gray-200 bg-surface p-8 text-center shadow-sm dark:border-white/10">
        <h1 className="text-3xl font-black text-text-primary">Acceso restringido</h1>
        <p className="mt-4 text-sm font-medium text-text-secondary">
          Esta app requiere una sesión autenticada para acceder a los datos del usuario. Configura Firebase Auth y
          un flujo de login antes de habilitar el acceso en producción.
        </p>
      </div>
    </div>
  );
}
