import { useEffect, useState } from 'react';

function getOnlineStatus(): boolean {
    return typeof navigator === 'undefined' ? true : navigator.onLine;
}

// Detecta si hay conexión de red usando navigator.onLine y los eventos
// online/offline. Se usa para mostrar el banner de modo sin conexión.
export function useConnectivity(): boolean {
    const [isOnline, setIsOnline] = useState<boolean>(getOnlineStatus);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return isOnline;
}