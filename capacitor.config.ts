import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hayniec.afpfra',
  appName: 'AF PFRA',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
