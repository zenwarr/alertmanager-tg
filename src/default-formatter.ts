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

  const labels = Object.keys(alert.labels).map(label => `${ label }: ${ alert.labels[label] }`).join("\n");
  const annotations = Object.keys(alert.annotations).map(annotation => `${ annotation }: ${ alert.annotations[annotation] }`).join("\n");

  let msg = `${ icon } <b>${ alert.status.toUpperCase() }</b> ${ icon } ${ alert.labels.alertname }
<b>Labels:</b>
${ labels }
<b>Annotations:</b>
${ annotations }`;
  if (formattedDuration) {
    msg += ` (for ${ formattedDuration })`;
  }

  return msg;
}
