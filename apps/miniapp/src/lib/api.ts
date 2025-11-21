import { API_BASE_URL } from "./constants";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

async function request<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
  headers: Record<string, string> = {},
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(
      `API error (${res.status} ${res.statusText}): ${errorText}`,
    );
  }

  return res.json() as Promise<T>;
}

export interface NomineeInput {
  fullName: string;
  email: string;
  tonWallet: string;
  share: number;
  razorpayContactId?: string;
}

export interface VaultConfig {
  ownerTonAddress: string;
  inactivityDays: number;
  nominees: NomineeInput[];
  backupEmail?: string;
}

export interface VaultSnapshot {
  vaultId: string;
  ownerTonAddress: string;
  lastPingAt: string;
  inactivityDays: number;
  status: "ACTIVE" | "WARNED" | "INACTIVE";
  nominees: Array<
    NomineeInput & {
      payoutStatus: "PENDING" | "PAID" | "FAILED" | "NOT_TRIGGERED";
    }
  >;
}

export const api = {
  createVault: (payload: VaultConfig) =>
    request<{ vaultId: string }>("/vaults", "POST", payload),
  fetchVault: (ownerTonAddress: string) =>
    request<VaultSnapshot>(`/vaults/${ownerTonAddress}`, "GET"),
  sendPing: (ownerTonAddress: string, signature: string) =>
    request<{ ok: boolean }>("/activity/ping", "POST", {
      ownerTonAddress,
      signature,
    }),
  registerNomineeBank: (payload: {
    vaultId: string;
    nomineeEmail: string;
    ifsc: string;
    accountNumber: string;
  }) => request("/nominees/bank", "POST", payload),
};

