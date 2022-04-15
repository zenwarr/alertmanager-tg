import { telegramSend } from "./telegram.ts";
import { defaultMsgFormat } from "./default-alert-formatter.ts";
import { WebhookData } from "./webhook-data.ts";


export interface FormatterTools {
  formatDuration: (duration: number) => string;
}


type AlertFormatter = (msg: WebhookData, tools: FormatterTools) => string;

let alertFormatter: AlertFormatter = defaultMsgFormat;
const formatterPath = Deno.env.get("FORMATTER_PATH");
if (formatterPath) {
  alertFormatter = (await import(formatterPath)).default;
}


export function handleWebhook(data: WebhookData): Promise<void> {
  return telegramSend(formatMsg(data));
}


function formatMsg(data: WebhookData): string {
  try {
    return alertFormatter(data, { formatDuration });
  } catch (err) {
    console.error(`Failed to format message: ${ err.message }, using default formatter now`);
    return defaultMsgFormat(data, { formatDuration });
  }
}


export function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${ days }d ${ hours % 24 }h ${ minutes % 60 }m ${ seconds % 60 }s`;
  } else if (hours > 0) {
    return `${ hours }h ${ minutes % 60 }m ${ seconds % 60 }s`;
  } else if (minutes > 0) {
    return `${ minutes }m ${ seconds % 60 }s`;
  } else {
    return `${ seconds }s`;
  }
}
