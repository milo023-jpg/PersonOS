import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MODULE_SHORTCUTS } from './appShortcuts';

function findShortcut(pathname: string) {
    return MODULE_SHORTCUTS.find(
        (s) => pathname === s.path || pathname.startsWith(`${s.path}/`)
    );
}

export default function RouteFavicon() {
    const { pathname } = useLocation();
    const shortcut = findShortcut(pathname);
    const href = shortcut ? shortcut.iconPath : '/favicon.png';

    useEffect(() => {
        let icon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
        if (!icon) {
            icon = document.createElement('link');
            icon.rel = 'icon';
            icon.type = 'image/png';
            document.head.appendChild(icon);
        }
        icon.href = href;

        let appleIcon = document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');
        if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.rel = 'apple-touch-icon';
            document.head.appendChild(appleIcon);
        }
        appleIcon.href = href;
    }, [href]);

    return null;
}