'use client';

import { useEffect, useState } from "react";
import { initWebApp } from "@telegram-apps/sdk-react";

export function useTelegramMiniApp() {
  const [tg, setTg] = useState<ReturnType<typeof initWebApp> | null>(null);

  useEffect(() => {
    try {
      const instance = initWebApp();
      setTg(instance);
      instance.sdkReady().then(() => {
        instance.ready();
        instance.expand();
        instance.settingsButton.show();
      });
    } catch (error) {
      console.warn("Telegram init skipped:", error);
    }
  }, []);

  return tg;
}

