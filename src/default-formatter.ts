import { Alert, WebhookData } from "./webhook-data.ts";
import { AlertFormatterTools, WebhookFormatterTools } from "./alert-formatter.ts";


const MAX_MSG_LENGTH = 4096;


export function defaultWebhookFormat(data: WebhookData, tools: WebhookFormatterTools) {
  return tools.formatAlertGroup(data.alerts, MAX_MSG_LENGTH, data.truncatedAlerts);
}


export function defaultAlertFormat(alert: Alert, tools: AlertFormatterTools) {
  const icon = alert.status === "resolved" ? "💚" : "🔥";
  const start = new Date(alert.startsAt);
  const end = new Date(alert.endsAt);
  const duration = end.getTime() - start.getTime();
  const formattedDuration = duration > 0 ? tools.formatDuration(duration) : null;

  let msg = `${ icon } <b>${ alert.status.toUpperCase() }</b> ${ icon } ${ alert.labels.name }
${ alert.annotations.description }`;
  if (formattedDuration) {
    msg += ` (for ${ formattedDuration })`;
  }

  return msg;
}
