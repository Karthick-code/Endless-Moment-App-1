import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.endlessmoment.admin',
  appName: 'Endless Moment Admin',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: false,
  },
  plugins: {
    StatusBar: {
      overlaysWebView: false,
      backgroundColor: '#0c0d10',
      style: 'LIGHT',
    },
  },
};

export default config;
