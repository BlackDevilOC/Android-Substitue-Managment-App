
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.substituemanagment.com',
  appName: 'Substitute Management',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'substituemanagment.com',
    cleartext: true
  },
  android: {
    buildOptions: {
      minSdkVersion: 21,
      targetSdkVersion: 33
    }
  }
};

export default config;
