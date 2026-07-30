import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.swayog.dashboard",
  appName: "Swayog Dashboard",
  webDir: "../dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  }
};

export default config;
