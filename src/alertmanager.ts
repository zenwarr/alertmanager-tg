import { Alert } from "./webhook-data.ts";


const AM_URL = Deno.env.get("ALERTMANAGER_URL") || "http://localhost:9093";

export async function getActiveAlerts(): Promise<Alert[]> {
  const reply = await fetch(`${ AM_URL }/api/v1/alerts`, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (reply.status !== 200) {
    throw new Error(`Alertmanager returned status ${ reply.status }`);
  }

  const r = await reply.json();
  return r.data.map((r: any) => ({
    status: r.status.state,
    labels: r.labels,
    annotations: r.annotations,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    generatorUrl: r.generatorURL,
    fingerprint: r.fingerprint
  }));
}
