export interface WebhookData {
  version: string;
  groupKey: string;
  truncatedAlerts: number;
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
