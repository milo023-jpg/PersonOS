import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../application/store/authStore';

interface Props {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const { userId, isReady } = useAuthStore();
  const location = useLocation();

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md rounded-3xl border border-gray-200 bg-surface p-8 text-center shadow-sm dark:border-white/10">
          <h1 className="text-2xl font-black text-text-primary">Cargando sesión</h1>
          <p className="mt-3 text-sm font-medium text-text-secondary">
            Verificando el estado de autenticación antes de acceder a tus datos.
          </p>
        </div>
      </div>
    );
  }

  if (!userId) {
    if (!import.meta.env.DEV) {
      return <Navigate to="/auth-required" replace state={{ from: location }} />;
    }

    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-xl rounded-3xl border border-amber-200 bg-amber-50 p-8 shadow-sm dark:border-amber-500/20 dark:bg-amber-500/10">
          <h1 className="text-2xl font-black text-amber-900 dark:text-amber-100">Autenticación requerida</h1>
          <p className="mt-3 text-sm font-medium text-amber-800 dark:text-amber-200">
            No hay una sesión activa. En desarrollo puedes definir `VITE_DEV_USER_ID` para abrir la app sin
            exponer un usuario hardcodeado en producción.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
