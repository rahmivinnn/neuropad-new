import { createRoot } from "react-dom/client";
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from "./App";
import "./index.css";

// Initialize Capacitor plugins
if (Capacitor.isNativePlatform()) {
  // Hide splash screen immediately to prevent flickering
  SplashScreen.hide();
  
  // Set status bar style
  StatusBar.setStyle({ style: Style.Light });
  StatusBar.setBackgroundColor({ color: '#ffffff' });
}

createRoot(document.getElementById("root")!).render(<App />);
