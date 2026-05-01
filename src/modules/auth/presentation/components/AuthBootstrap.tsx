import { useEffect } from 'react';
import { useAuthStore } from '../../application/store/authStore';

export default function AuthBootstrap() {
  const initializeAuthListener = useAuthStore((state) => state.initializeAuthListener);

  useEffect(() => {
    initializeAuthListener();
  }, [initializeAuthListener]);

  return null;
}
