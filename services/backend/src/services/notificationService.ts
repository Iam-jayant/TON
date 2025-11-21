import sgMail from "@sendgrid/mail";
import { env } from "../config/env";
import { logger } from "../utils/logger";

if (env.sendgridApiKey) {
  sgMail.setApiKey(env.sendgridApiKey);
}

interface EmailPayload {
  to: string;
  subject: string;
  text: string;
}

export async function sendNomineeEmail(payload: EmailPayload) {
  if (!env.sendgridApiKey) {
    logger.warn({ to: payload.to }, "SendGrid key missing, skipping email");
    return;
  }

  await sgMail.send({
    to: payload.to,
    from: env.sendgridFromEmail,
    subject: payload.subject,
    text: payload.text,
  });
}

