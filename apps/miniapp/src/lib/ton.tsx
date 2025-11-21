'use client';

import {
  THEME,
  TonConnectButton,
  TonConnectUIProvider,
  useTonAddress,
  useTonConnectUI,
} from "@tonconnect/ui-react";
import { TON_MANIFEST_URL } from "./constants";
import { PropsWithChildren } from "react";

export function TonProvider({ children }: PropsWithChildren) {
  return (
    <TonConnectUIProvider
      manifestUrl={TON_MANIFEST_URL}
      uiPreferences={{
        theme: THEME.DARK,
      }}
    >
      {children}
    </TonConnectUIProvider>
  );
}

export function TonWalletButton() {
  return (
    <div className="flex items-center justify-end">
      <TonConnectButton />
    </div>
  );
}

export function useTon() {
  const [tonConnectUI] = useTonConnectUI();
  const tonAddress = useTonAddress();

  return {
    tonConnectUI,
    tonAddress,
  };
}

