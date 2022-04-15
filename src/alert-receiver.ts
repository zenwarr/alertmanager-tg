import { sendAlerts } from "./telegram.ts";
import { defaultMsgFormat } from "./default-alert-formatter.ts";
import { Alert, WebhookData } from "./webhook-data.ts";


export interface FormatterTools {
  formatDuration: (duration: number) => string;
}


type AlertFormatter = (msg: Alert[], tools: FormatterTools) => string;

let alertFormatter: AlertFormatter = defaultMsgFormat;
const formatterPath = Deno.env.get("FORMATTER_PATH");
if (formatterPath) {
  alertFormatter = (await import(formatterPath)).default;
}


export function handleWebhook(data: WebhookData): Promise<void> {
  return sendAlerts(formatAlerts(data.alerts));
}


export function formatAlerts(alerts: Alert[]): string {
  try {
    return alertFormatter(alerts, { formatDuration });
  } catch (err) {
    if (alertFormatter !== defaultMsgFormat) {
      return `${ alerts.length } notifications received, but we cannot show them because of a formatter failure`;
    } else {
      console.error(`Failed to format message: ${ err.message }, using default formatter now`);
      return defaultMsgFormat(alerts, { formatDuration });
    }
  }
}


export function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${ days }d ${ hours % 24 }h ${ minutes % 60 }m`;
  } else if (hours > 0) {
    return `${ hours }h ${ minutes % 60 }m`;
  } else if (minutes > 0) {
    return `${ minutes }m`;
  } else {
    return `${ seconds }s`;
  }
}
