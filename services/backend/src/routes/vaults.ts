import { Router } from "express";
import { z } from "zod";
import { createVault, findVaultByOwner } from "../repositories/vaultRepository";
import { manualStatusCheck } from "../services/deadmanService";

const router = Router();

const nomineeSchema = z.object({
  fullName: z.string().min(3),
  email: z.string().email(),
  tonWallet: z.string().min(10),
  share: z.number().min(1).max(100),
});

const vaultSchema = z.object({
  ownerTonAddress: z.string().min(10),
  inactivityDays: z.number().min(1).max(365),
  backupEmail: z.string().email().optional(),
  nominees: z.array(nomineeSchema).min(1),
});

router.post("/", async (req, res, next) => {
  try {
    const payload = vaultSchema.parse(req.body);
    const vault = await createVault(payload);
    res.json({ vaultId: vault.vaultId });
  } catch (error) {
    next(error);
  }
});

router.get("/:ownerTonAddress", async (req, res, next) => {
  try {
    const vault = await findVaultByOwner(req.params.ownerTonAddress);
    if (!vault) {
      return res.status(404).json({ message: "Vault not found" });
    }
    const refreshed = await manualStatusCheck(req.params.ownerTonAddress);
    res.json(refreshed ?? vault);
  } catch (error) {
    next(error);
  }
});

export default router;

