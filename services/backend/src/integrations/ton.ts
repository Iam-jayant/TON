import TonWeb from "tonweb";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const tonweb = new TonWeb(
  new TonWeb.HttpProvider(env.tonCenterApi ?? "https://testnet.toncenter.com/api/v2/jsonRPC", {
    apiKey: env.tonCenterApiKey,
  }),
);

export async function performTonSweep(ownerAddress: string) {
  logger.info({ ownerAddress }, "Simulating TON sweep via delegated wallet");
  // TODO: wire with actual wallet plugin + tolk contract once deployed.
  return {
    txHash: `mock_tx_${Date.now()}`,
    ownerAddress,
  };
}

