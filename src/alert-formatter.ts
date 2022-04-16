import { defaultAlertFormat, defaultWebhookFormat } from "./default-formatter.ts";
import { Alert, WebhookData } from "./webhook-data.ts";


export interface AlertFormatterTools {
  formatDuration: (duration: number) => string;
}


export interface WebhookFormatterTools extends AlertFormatterTools {
  formatAlert: (alert: Alert) => string;
  formatAlertGroup: (alerts: Alert[], maxLength: number, alreadyHiddenAlerts: number, formatter?: AlertFormatter) => string;
}


export type AlertFormatter = (alert: Alert, tools: AlertFormatterTools) => string;
type WebhookFormatter = (data: WebhookData, tools: WebhookFormatterTools) => string;

const formatterModulePath = Deno.env.get("FORMATTER_PATH");
let alertFormatter: AlertFormatter = defaultAlertFormat;
if (formatterModulePath) {
  alertFormatter = (await import(formatterModulePath)).alert ?? defaultAlertFormat;
}

let webhookFormatter: WebhookFormatter = defaultWebhookFormat;
if (formatterModulePath) {
  webhookFormatter = (await import(formatterModulePath)).webhook ?? defaultWebhookFormat;
}

export function formatWebhook(data: WebhookData, formatter?: WebhookFormatter): string {
  const usingFormatter = formatter || webhookFormatter;
  try {
    return usingFormatter(data, { formatDuration, formatAlert, formatAlertGroup });
  } catch (err) {
    if (usingFormatter === defaultWebhookFormat) {
      return `${ data.alerts.length } notifications received, but we cannot show them because of a formatter failure`;
    } else {
      console.error(`Failed to format message: ${ err.message }, using default formatter now`);
      return formatWebhook(data, defaultWebhookFormat);
    }
  }
}

export function formatAlert(alert: Alert, formatter?: AlertFormatter): string {
  const usingFormatter = formatter || alertFormatter;
  try {
    return usingFormatter(alert, { formatDuration });
  } catch (err) {
    if (usingFormatter === defaultAlertFormat) {
      return `${ alert.status }: alert received, but we cannot show it because of a formatter failure`;
    } else {
      console.error(`Failed to format alert: ${ err.message }, using default formatter now`);
      return formatAlert(alert, defaultAlertFormat);
    }
  }
}

export function formatAlertGroup(alerts: Alert[], maxLength: number, alreadyHiddenAlerts: number, formatter?: AlertFormatter) {
  const MAX_FOOTER_LENGTH = 10;
  maxLength -= MAX_FOOTER_LENGTH;

  let showedAlerts = 0;
  const messages: string[] = [];
  let pureMessagesLen = 0;
  for (const alert of alerts) {
    const msg = formatAlert(alert, formatter);
    if (msg.length + pureMessagesLen + messages.length * 2 > maxLength) {
      break;
    }

    messages.push(msg);
    pureMessagesLen += msg.length;
    ++showedAlerts;
  }

  let msg = messages.join("\n\n");

  const hiddenAlerts = alreadyHiddenAlerts + (alerts.length - showedAlerts);
  if (hiddenAlerts) {
    msg += `\n\n+${ hiddenAlerts } more`;
  }

  return msg;
}

function formatDuration(ms: number) {
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
