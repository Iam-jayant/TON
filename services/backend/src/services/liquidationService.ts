import { Vault } from "../types/vault";
import { sendNomineeEmail } from "./notificationService";
import { logger } from "../utils/logger";
import { performTonSweep } from "../integrations/ton";
import { createRazorpayPayout } from "../integrations/razorpay";
import { updateVault } from "../repositories/vaultRepository";

export async function triggerLiquidation(vault: Vault) {
  logger.info({ vaultId: vault.vaultId }, "Triggering liquidation flow");

  const tonSweepTx = await performTonSweep(vault.ownerTonAddress);
  logger.info({ tonSweepTx }, "TON sweep submitted");

  for (const nominee of vault.nominees) {
    const amount = nominee.share / 100;
    const payout = await createRazorpayPayout({
      vaultId: vault.vaultId,
      nominee,
      amountShare: amount,
    });
    await sendNomineeEmail({
      to: nominee.email,
      subject: "Inheritor payout initiated",
      text: `Inheritor has triggered a payout for you. Razorpay reference ${payout.id}`,
    });
    nominee.payoutStatus = payout.status;
  }

  await updateVault({ ...vault, status: "INACTIVE" });
}

