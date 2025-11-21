'use client';

import { useEffect, useState } from "react";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: WebApp;
    };
  }

  interface WebApp {
    initData?: string;
    initDataUnsafe?: Record<string, unknown>;
    ready: () => void;
    expand: () => void;
    close: () => void;
    sendData: (data: string) => void;
    onEvent: (event: string, handler: () => void) => void;
    offEvent: (event: string, handler: () => void) => void;
    version?: string;
    platform?: string;
    colorScheme?: string;
    themeParams?: Record<string, string>;
  }
}

export function useTelegramMiniApp() {
  const [tg, setTg] = useState<WebApp | null>(null);

  useEffect(() => {
    const webApp = window?.Telegram?.WebApp;
    if (!webApp) {
      console.warn("Telegram WebApp context not detected; running in browser mode.");
      return;
    }
    try {
      webApp.ready();
      webApp.expand();
      setTg(webApp);
    } catch (error) {
      console.warn("Failed to initialize Telegram WebApp", error);
    }
  }, []);

  return tg;
}

