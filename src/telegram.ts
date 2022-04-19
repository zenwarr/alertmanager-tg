import { Bot } from "https://deno.land/x/grammy@v1.7.3/mod.ts";
import { apiThrottler } from "https://deno.land/x/grammy_transformer_throttler@v1.1.2/mod.ts";
import { deleteChat, getChats, saveChat } from "./db.ts";
import { getActiveAlerts } from "./alertmanager.ts";
import { formatAlert } from "./alert-formatter.ts";


const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
if (!BOT_TOKEN) {
  console.error("BOT_TOKEN not provided");
  Deno.exit(1);
}

const DEFAULT_CHATS = Deno.env.get("CHAT_ID")?.split(";") || [];
const ADMINS = Deno.env.get("ADMIN_ID")?.split(";") ?? [];


const bot = new Bot(BOT_TOKEN);
bot.api.config.use(apiThrottler());


function getChatsReceivingAlerts() {
  const chats = getChats();
  for (const defChat of DEFAULT_CHATS) {
    if (!chats.includes(defChat)) {
      chats.push(defChat);
    }
  }

  return chats;
}


export async function sendAlerts(message: string) {
  for (const chatId of getChatsReceivingAlerts()) {
    await bot.api.sendMessage(chatId, message, {
      parse_mode: "HTML"
    });
  }
}


export function startBot() {
  bot.command("start", async ctx => {
    if (!isCommandAllowedFrom(ctx.from?.id)) {
      return;
    }

    await saveChat("" + ctx.chat.id);
    await ctx.reply(`Hello! This chat (id: ${ ctx.chat.id }) is going to receive alerts now`);
  });

  bot.command("stop", async ctx => {
    if (!isCommandAllowedFrom(ctx.from?.id)) {
      return;
    }

    if (DEFAULT_CHATS.includes("" + ctx.chat.id)) {
      await ctx.reply(`This chat (id: ${ ctx.chat.id }) is configured in bot settings, you cannot unsubscribe it with a command`);
      return;
    }

    await deleteChat("" + ctx.chat.id);
    await ctx.reply(`Alerts are off for this chat (id: ${ ctx.chat.id })`);
  });

  bot.command("alerts", async ctx => {
    if (!isCommandAllowedFrom(ctx.from?.id)) {
      return;
    }

    const alerts = await getActiveAlerts();
    if (alerts.length === 0) {
      await ctx.reply("No active alerts");
    } else {
      const msg = alerts.map(a => formatAlert(a)).join("\n\n");
      await ctx.reply(msg, {
        parse_mode: "HTML"
      });
    }
  });

  bot.command("chats", async ctx => {
    if (!isCommandAllowedFrom(ctx.from?.id)) {
      return;
    }

    const names: string[] = [];
    for (const chatId of getChatsReceivingAlerts()) {
      try {
        const chat: any = await bot.api.getChat(chatId);
        names.push(chat.username ? `@${ chat.username }` : (chat.title || "?") + ` (${ chat.type })`);
      } catch (error: any) {
        names.push(`#${ chatId } (failed to get chat name, error: ${ error?.message ?? "unknown" })`);
      }
    }

    await ctx.reply("Clients receiving alerts now:\n\n" + names.join("\n"));
  });

  bot.catch(async error => {
    console.error(error);
    await error.ctx.reply("Sorry, there was an error processing your command, check logs for details");
  });

  return bot.start({
    timeout: 60
  });
}


function isCommandAllowedFrom(sender: string | number | undefined) {
  if (!sender) {
    console.warn(`Ignored command from non-approved user (no sender)`);
    return false;
  }

  if (!ADMINS.includes("" + sender)) {
    console.warn(`Ignored command from non-approved user (id: ${ sender })`);
    return false;
  }

  return true;
}


export async function destroyBot() {
  await bot.stop();
}
