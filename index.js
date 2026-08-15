const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Telegraf(BOT_TOKEN);

const PORT = process.env.PORT || 10000;

// صفحه سلامت برای Render
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("KX Panel Bot is alive 🔥");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// منوی اصلی
const mainMenu = Markup.inlineKeyboard([
  [
    Markup.button.callback("📥 دانلود پنل", "download_panel"),
    Markup.button.callback("🎯 Sensitivity", "sensitivity")
  ],
  [
    Markup.button.callback("👑 VIP Pack", "vip_pack"),
    Markup.button.callback("🆘 Support", "support")
  ]
]);

bot.start((ctx) => {
  ctx.reply(
    "🔥 به ASHKAN KX خوش اومدی!\n\n" +
    "🎮 مرکز دریافت پنل و تنظیمات KX\n\n" +
    "یکی از گزینه‌های زیر رو انتخاب کن:",
    mainMenu
  );
});

// دکمه دانلود پنل
bot.action("download_panel", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("📥 بخش دانلود پنل\n\nفعلاً پنلی برای دریافت ثبت نشده.");
});

// دکمه Sensitivity
bot.action("sensitivity", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("🎯 بخش Sensitivity\n\nبه‌زودی فعال میشه 🔥");
});

// دکمه VIP
bot.action("vip_pack", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("👑 VIP Pack\n\nاین بخش به‌زودی فعال میشه.");
});

// دکمه Support
bot.action("support", async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply("🆘 Support\n\nپیامت رو برای پشتیبانی ارسال کن.");
});

bot.launch();

console.log("KX Panel Bot is running...");
