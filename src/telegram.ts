const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
const CHAT_ID = Deno.env.get("CHAT_ID");

if (!BOT_TOKEN) {
  console.error("BOT_TOKEN not provided");
  Deno.exit(1);
}

if (!CHAT_ID) {
  console.error("CHAT_ID not provided");
  Deno.exit(1);
}


export async function telegramSend(message: string) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text: message,
      parse_mode: "HTML"
    }),
  });
}
