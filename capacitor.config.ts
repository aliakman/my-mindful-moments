import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f31f9221f8e64a57b19c8be7e6828d02',
  appName: 'Remind Me',
  webDir: 'dist',
  server: {
    url: 'https://f31f9221-f8e6-4a57-b19c-8be7e6828d02.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#CE8C5B',
    },
    Geolocation: {
      // iOS: Will use NSLocationWhenInUseUsageDescription
      // Android: ACCESS_FINE_LOCATION and ACCESS_COARSE_LOCATION
    },
  },
};

export default config;
