import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.personos.app',
    appName: 'PersonOS',
    webDir: 'dist',
    plugins: {
        FirebaseAuthentication: {
            providers: ['google.com'],
        },
    },
};

export default config;