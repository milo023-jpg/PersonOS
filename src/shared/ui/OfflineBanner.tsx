import { useConnectivity } from '../hooks/useConnectivity';

// Aviso global que aparece cuando la app no tiene conexión. Los datos se leen
// desde el caché local y las escrituras se encolan hasta que vuelva la red.
export default function OfflineBanner() {
    const isOnline = useConnectivity();

    if (isOnline) {
        return null;
    }

    return (
        <div className="sticky top-0 z-[70] w-full bg-warning/10 border-b border-warning/30 px-4 py-2 text-center">
            <p className="text-xs md:text-sm font-bold text-warning">
                Sin conexión: mostrando datos guardados. Tus cambios se sincronizarán al reconectar.
            </p>
        </div>
    );
}