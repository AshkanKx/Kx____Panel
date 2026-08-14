const { Telegraf } = require("telegraf");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("🔥 به ASHKAN KX خوش اومدی!");
});

bot.launch();

console.log("KX Panel Bot is running...");
