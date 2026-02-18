import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import App from './App.vue';
import './style.css';

// Import Capacitor plugins
import { App as CapApp } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

const app = createApp(App);

app.use(createPinia());
app.use(router);

// Initialize app
async function initializeApp() {
  // Configure status bar (mobile only)
  if (Capacitor.isNativePlatform()) {
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#1e293b' });
  }

  // Mount app
  app.mount('#app');

  // Hide splash screen after app loads
  if (Capacitor.isNativePlatform()) {
    setTimeout(() => {
      SplashScreen.hide({ fadeOutDuration: 300 });
    }, 1000);
  }
}

// App state change listener
CapApp.addListener('appStateChange', ({ isActive }) => {
  console.log('App state changed. Is active:', isActive);
});

// Initialize
initializeApp();

import { Capacitor } from '@capacitor/core';
