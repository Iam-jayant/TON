import { createServer } from "./server";
import { env } from "./config/env";
import { logger } from "./utils/logger";
import { bootstrapDeadmanSwitch } from "./services/deadmanService";

const app = createServer();

app.listen(env.port, () => {
  logger.info(`Inheritor backend listening on :${env.port}`);
});

bootstrapDeadmanSwitch();

