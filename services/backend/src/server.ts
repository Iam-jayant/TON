import express from "express";
import cors from "cors";
import morgan from "morgan";
import vaultRoutes from "./routes/vaults";
import activityRoutes from "./routes/activity";
import nomineeRoutes from "./routes/nominees";
import { logger } from "./utils/logger";

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: "1mb" }));
  app.use(morgan("tiny"));

  app.get("/health", (_req, res) => res.json({ ok: true, time: Date.now() }));

  app.use("/vaults", vaultRoutes);
  app.use("/activity", activityRoutes);
  app.use("/nominees", nomineeRoutes);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error(err, "API error");
    res
      .status(500)
      .json({ message: err.message ?? "Unexpected server error" });
  });

  return app;
}

