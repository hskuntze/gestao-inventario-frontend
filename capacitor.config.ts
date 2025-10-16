import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.ctcea.inventario',
  appName: 'Gestão de Inventário',
  webDir: 'build',
  server: {
    androidScheme: 'http'
  }
};

export default config;
