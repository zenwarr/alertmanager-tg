import { FormatterTools} from "./alert-receiver.ts";
import { Alert } from "./webhook-data.ts";


export function defaultMsgFormat(data: Alert[], tools: FormatterTools) {
  const messages: string[] = [];

  for (const alert of data) {
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

    messages.push(msg);
  }

  return messages.join("\n\n");
}
