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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
