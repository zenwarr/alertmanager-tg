import { Bot } from "https://deno.land/x/grammy@v1.7.3/mod.ts";
import { deleteChat, getChats, saveChat } from "./db.ts";
import { getActiveAlerts } from "./alertmanager.ts";
import { formatAlerts } from "./alert-receiver.ts";


const BOT_TOKEN = Deno.env.get("BOT_TOKEN");
if (!BOT_TOKEN) {
  console.error("BOT_TOKEN not provided");
  Deno.exit(1);
}

const DEFAULT_CHATS = Deno.env.get("CHAT_ID")?.split(";") || [];


const ADMINS = Deno.env.get("ADMIN_ID")?.split(";") ?? [];


const bot = new Bot(BOT_TOKEN);


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
    // todo: request limits
    await bot.api.sendMessage(chatId, message, {
      parse_mode: "HTML"
    });
  }
}


export function startBot() {
  bot.command("start", async ctx => {
    if (!commandAllowedFrom(ctx.from?.id)) {
      return;
    }

    await saveChat("" + ctx.chat.id);
    await ctx.reply(`Hello! This chat (id: ${ ctx.chat.id }) is going to receive alerts now`);
  });

  bot.command("stop", async ctx => {
    if (!commandAllowedFrom(ctx.from?.id)) {
      return;
    }

    await deleteChat("" + ctx.chat.id);
    await ctx.reply(`Alerts are off for this chat (id: ${ ctx.chat.id })`);
  });

  bot.command("alerts", async ctx => {
    if (!commandAllowedFrom(ctx.from?.id)) {
      return;
    }

    const alerts = await getActiveAlerts();
    if (alerts.length === 0) {
      await ctx.reply("No active alerts");
    } else {
      await ctx.reply(formatAlerts(alerts), {
        parse_mode: "HTML"
      });
    }
  });

  bot.command("chats", async ctx => {
    if (!commandAllowedFrom(ctx.from?.id)) {
      return;
    }

    const names: string[] = [];
    for (const chatId of getChatsReceivingAlerts()) {
      const chat: any = await bot.api.getChat(chatId);
      names.push(chat.username ? `@${ chat.username }` : (chat.title || "?") + ` (${ chat.type })`);
    }

    await ctx.reply("Clients receiving alerts now:\n\n" + names.join("\n"));
  });

  return bot.start({
    timeout: 60
  });
}


function commandAllowedFrom(sender: string | number | undefined) {
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
