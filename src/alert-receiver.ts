import { sendAlerts } from "./telegram.ts";
import { WebhookData } from "./webhook-data.ts";
import { formatWebhook } from "./alert-formatter.ts";


export function handleWebhook(data: WebhookData): Promise<void> {
  return sendAlerts(formatWebhook(data));
}
