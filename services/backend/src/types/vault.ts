export type VaultStatus = "ACTIVE" | "WARNED" | "INACTIVE";

export interface Nominee {
  fullName: string;
  email: string;
  tonWallet: string;
  share: number;
  razorpayContactId?: string;
  razorpayFundAccountId?: string;
  payoutStatus?: "NOT_TRIGGERED" | "PENDING" | "PAID" | "FAILED";
  bank?: {
    ifsc: string;
    accountNumber: string;
  };
}

export interface Vault {
  vaultId: string;
  ownerTonAddress: string;
  inactivityDays: number;
  nominees: Nominee[];
  backupEmail?: string;
  status: VaultStatus;
  createdAt: string;
  updatedAt: string;
  lastPingAt?: string;
}

