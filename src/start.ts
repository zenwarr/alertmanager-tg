import { serve } from "https://deno.land/std@0.135.0/http/server.ts";
import { handleWebhook } from "./alert-receiver.ts";
import { destroyBot, startBot } from "./telegram.ts";
import { destroyDb } from "./db.ts";


Deno.addSignalListener("SIGINT", async () => {
  console.log("SIGINT received, shutting down...");
  await stop();
});

Deno.addSignalListener("SIGTERM", async () => {
  console.log("SIGTERM received, shutting down...");
  await stop();
});

async function stop() {
  destroyDb();
  await destroyBot();
  Deno.exit(0);
}

const HTTP_PORT = +(Deno.env.get("HTTP_PORT") || 8080);
if (isNaN(HTTP_PORT)) {
  throw new Error("HTTP_PORT must be provided and be a number, got: " + (HTTP_PORT ?? "<not defined>"));
}

console.log(`Alertmanager webhook server is listening on port ${ HTTP_PORT }`);
await Promise.all([
  serve(handler, { port: HTTP_PORT }),
  startBot()
]);

async function handler(req: Request): Promise<Response> {
  const path = new URL(req.url).pathname;
  if (path === "/" && req.method === "POST") {
    const contentBuf = await req.arrayBuffer();
    const content = new TextDecoder().decode(contentBuf);
    await handleWebhook(JSON.parse(content));
    return new Response(null, { status: 200 });
  } else {
    return new Response(null, { status: 404 });
  }
}
