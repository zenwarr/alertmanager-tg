import { sendAlerts } from "./telegram.ts";
import { WebhookData } from "./webhook-data.ts";
import { formatWebhook } from "./alert-formatter.ts";


export async function handleWebhook(data: WebhookData): Promise<boolean> {
  const failedCount = await sendAlerts(formatWebhook(data));
  return failedCount === 0;
}
