import { Router } from "express";
import { z } from "zod";
import { recordPing } from "../repositories/vaultRepository";

const router = Router();

const pingSchema = z.object({
  ownerTonAddress: z.string().min(10),
  signature: z.string().min(10),
});

router.post("/ping", async (req, res, next) => {
  try {
    const payload = pingSchema.parse(req.body);
    const updated = await recordPing(payload.ownerTonAddress);
    res.json({ ok: true, lastPingAt: updated.lastPingAt });
  } catch (error) {
    next(error);
  }
});

export default router;

