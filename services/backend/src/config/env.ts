import * as dotenv from "dotenv";
dotenv.config();

function getEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  if (!value) {
    return undefined;
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 4000),
  tonOraclePrivateKey: getEnv("TON_ORACLE_PRIVATE_KEY"),
  tonCenterApi: getEnv("TON_CENTER_API"),
  tonCenterApiKey: getEnv("TON_CENTER_API_KEY"),
  razorpayKeyId: getEnv("RAZORPAY_KEY_ID"),
  razorpayKeySecret: getEnv("RAZORPAY_KEY_SECRET"),
  razorpayPayoutAccount: getEnv("RAZORPAY_PAYOUT_ACCOUNT"),
  payoutPoolUsd: Number(process.env.PAYOUT_POOL_USD ?? "0"),
  sendgridApiKey: getEnv("SENDGRID_API_KEY"),
  sendgridFromEmail: getEnv("SENDGRID_FROM_EMAIL") ?? "alerts@inheritor.app",
};

