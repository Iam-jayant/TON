import { Router } from "express";
import { z } from "zod";
import {
  findVaultById,
  updateVault,
} from "../repositories/vaultRepository";
import { ensureRazorpayContact } from "../integrations/razorpay";

const router = Router();

const bankSchema = z.object({
  vaultId: z.string().min(4),
  nomineeEmail: z.string().email(),
  ifsc: z.string().min(10),
  accountNumber: z.string().min(6),
});

router.post("/bank", async (req, res, next) => {
  try {
    const payload = bankSchema.parse(req.body);
    const vault = await findVaultById(payload.vaultId);
    if (!vault) {
      return res.status(404).json({ message: "Vault not found" });
    }
    const nominee = vault.nominees.find(
      (n) => n.email.toLowerCase() === payload.nomineeEmail.toLowerCase(),
    );
    if (!nominee) {
      return res.status(404).json({ message: "Nominee not found" });
    }
    nominee.bank = {
      ifsc: payload.ifsc,
      accountNumber: payload.accountNumber,
    };
    const ensured = await ensureRazorpayContact(nominee);
    nominee.razorpayContactId = ensured.contactId;
    nominee.razorpayFundAccountId = ensured.fundAccountId;
    await updateVault(vault);
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;

