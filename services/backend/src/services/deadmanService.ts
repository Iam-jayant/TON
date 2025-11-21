import cron from "node-cron";
import { differenceInDays } from "date-fns";
import {
  findVaultByOwner,
  listVaults,
  updateVault,
} from "../repositories/vaultRepository";
import { Vault } from "../types/vault";
import { triggerLiquidation } from "./liquidationService";
import { logger } from "../utils/logger";

function evaluateVaultStatus(vault: Vault): Vault["status"] {
  if (!vault.lastPingAt) return "WARNED";
  const days = differenceInDays(new Date(), new Date(vault.lastPingAt));
  if (days >= vault.inactivityDays) {
    return "INACTIVE";
  }
  if (days >= Math.max(1, Math.floor(vault.inactivityDays * 0.7))) {
    return "WARNED";
  }
  return "ACTIVE";
}

async function checkVault(vault: Vault) {
  const status = evaluateVaultStatus(vault);
  if (status === vault.status) return;

  const updated = await updateVault({ ...vault, status });
  logger.info({ vaultId: updated.vaultId, status }, "vault status updated");

  if (status === "INACTIVE") {
    await triggerLiquidation(updated);
  }
}

export function bootstrapDeadmanSwitch() {
  cron.schedule("*/15 * * * *", async () => {
    const vaults = await listVaults();
    await Promise.all(vaults.map(checkVault));
  });
  logger.info("Deadman switch cron scheduled (15 min)");
}

export async function manualStatusCheck(ownerTonAddress: string) {
  const vault = await findVaultByOwner(ownerTonAddress);
  if (!vault) return null;
  await checkVault(vault);
  return findVaultByOwner(ownerTonAddress);
}

