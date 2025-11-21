import Razorpay from "razorpay";
import { env } from "../config/env";
import { Nominee } from "../types/vault";
import { logger } from "../utils/logger";

interface RazorpayClient {
  contacts: {
    create(payload: {
      name: string;
      email: string;
    }): Promise<{ id: string }>;
  };
  fundAccount: {
    create(payload: {
      contact_id: string;
      account_type: "bank_account";
      bank_account: {
        name: string;
        ifsc: string;
        account_number: string;
      };
    }): Promise<{ id: string }>;
  };
  payouts: {
    create(payload: {
      account_number: string;
      fund_account_id: string;
      amount: number;
      currency: string;
      purpose: string;
      queue_if_low_balance: boolean;
      reference_id: string;
      narration: string;
    }): Promise<{ id: string; status: string; amount: number }>;
  };
}

const client: RazorpayClient | null =
  env.razorpayKeyId && env.razorpayKeySecret
    ? (new Razorpay({
        key_id: env.razorpayKeyId,
        key_secret: env.razorpayKeySecret,
      }) as unknown as RazorpayClient)
    : null;

export async function ensureRazorpayContact(nominee: Nominee) {
  if (!client) {
    logger.warn("Razorpay credentials missing; returning mock contact id");
    return {
      contactId: nominee.razorpayContactId ?? `mock_contact_${nominee.email}`,
      fundAccountId:
        nominee.razorpayFundAccountId ?? `mock_fund_${nominee.email}`,
    };
  }

  const contact = nominee.razorpayContactId
    ? { id: nominee.razorpayContactId }
    : await client.contacts.create({
        name: nominee.fullName,
        email: nominee.email,
      });

  const fundAccount = nominee.razorpayFundAccountId
    ? { id: nominee.razorpayFundAccountId }
    : await client.fundAccount.create({
        contact_id: contact.id,
        account_type: "bank_account",
        bank_account: {
          name: nominee.fullName,
          ifsc: nominee.bank?.ifsc ?? "TEST0001234",
          account_number: nominee.bank?.accountNumber ?? "000111222333",
        },
      });

  return {
    contactId: contact.id,
    fundAccountId: fundAccount.id,
  };
}

type PayoutStatus = "NOT_TRIGGERED" | "PENDING" | "PAID" | "FAILED";

export async function createRazorpayPayout(payload: {
  vaultId: string;
  nominee: Nominee;
  amountShare: number;
}): Promise<{ id: string; status: PayoutStatus; amount: number }> {
  const { nominee, amountShare } = payload;
  const ensured = await ensureRazorpayContact(nominee);

  if (!client) {
    return {
      id: `mock_payout_${Date.now()}`,
      status: "PENDING",
      amount: amountShare,
    };
  }

  const payout = await client.payouts.create({
    account_number: env.razorpayPayoutAccount ?? "000111222333",
    fund_account_id: ensured.fundAccountId,
    amount: Math.round(amountShare * 100 * (env.payoutPoolUsd ?? 1)),
    currency: "INR",
    purpose: "payout",
    queue_if_low_balance: true,
    reference_id: `${payload.vaultId}_${nominee.email}`,
    narration: "Inheritor settlement",
  });

  return {
    id: payout.id,
    status:
      payout.status === "processed"
        ? "PAID"
        : payout.status === "failed"
          ? "FAILED"
          : "PENDING",
    amount: payout.amount,
  };
}

