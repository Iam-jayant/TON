export const API_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:4000";

export const TON_MANIFEST_URL = process.env.NEXT_PUBLIC_TON_CONNECT_MANIFEST as string;

export const DEADMAN_THRESHOLDS = [
  { label: "14 days", value: 14 },
  { label: "30 days", value: 30 },
  { label: "60 days", value: 60 },
  { label: "90 days", value: 90 },
];

