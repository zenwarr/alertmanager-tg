import { telegramSend } from "./telegram.ts";


export interface WebhookData {
  version: string;
  groupKey: string;
  truncateAlerts: number;
  status: "resolved" | "firing";
  receiver: string;
  groupLabels: { [key: string]: string };
  commonLabels: { [key: string]: string };
  commonAnnotations: { [key: string]: string };
  externalURL: string;
  alerts: Alert[];
}


export interface Alert {
  status: "resolved" | "firing";
  labels: { [key: string]: string };
  annotations: { [key: string]: string };
  startsAt: string;
  endsAt: string;
  generatorURL: string;
  fingerprint: string;
}


export function handleWebhook(data: WebhookData): Promise<void> {
  return telegramSend(formatMsg(data));
}


function formatMsg(data: WebhookData): string {
  const messages: string[] = [];

  for (const alert of data.alerts) {
    const icon = alert.status === "resolved" ? "💚" : "🔥";
    const start = new Date(alert.startsAt);
    const end = new Date(alert.endsAt);
    const duration = end.getTime() - start.getTime();
    const formattedDuration = duration > 0 ? formatDuration(duration) : null;

    let msg = `${ icon } <b>${ alert.status.toUpperCase() }</b> ${ icon } ${ alert.labels.name }
${ alert.annotations.description }`;
    if (formattedDuration) {
      msg += ` (for ${ formattedDuration })`;
    }

    messages.push(msg);
  }

  return messages.join("\n\n");
}


function formatDuration(ms: number) {
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
