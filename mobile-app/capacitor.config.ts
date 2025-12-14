import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.whiz.pos.mobile',
  appName: 'Whiz Pos',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allow HTTP traffic for LAN sync
    allowNavigation: [
      "192.168.*.*",
      "10.0.2.2"
    ]
  },
  android: {
    allowMixedContent: true
  },
  plugins: {
    BarcodeScanner: {
      // Configuration for barcode scanner if needed
    }
  }
};

export default config;
