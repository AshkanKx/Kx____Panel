const { Telegraf, Markup } = require("telegraf");
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Telegraf(BOT_TOKEN);

// ===============================
// کانال‌های عضویت اجباری
// ===============================

const REQUIRED_CHANNELS = [
  "@AshkanKx",
  "@AshkanKx2"
];

// ===============================
// سرور Render
// ===============================

const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    "Content-Type": "text/plain"
  });

  res.end("KX Panel Bot is alive 🔥");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// ===============================
// منوی اصلی
// ===============================

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

// ===============================
// بررسی عضویت
// ===============================

async function checkMembership(ctx) {
  for (const channel of REQUIRED_CHANNELS) {
    try {
      const member = await ctx.telegram.getChatMember(
        channel,
        ctx.from.id
      );

      if (
        member.status === "left" ||
        member.status === "kicked"
      ) {
        return false;
      }
    } catch (error) {
      console.log(
        `Membership check failed for ${channel}:`,
        error.message
      );

      return false;
    }
  }

  return true;
}

// ===============================
// /start
// ===============================

bot.start((ctx) => {
  ctx.reply(
    "🔥 به ASHKAN KX خوش اومدی!\n\n" +
    "🎮 مرکز دریافت پنل و تنظیمات KX\n\n" +
    "یکی از گزینه‌های زیر رو انتخاب کن:",
    mainMenu
  );
});

// ===============================
// دریافت ZIP و نمایش File ID
// ===============================

bot.on("document", async (ctx) => {
  const document = ctx.message.document;

  const fileId = document.file_id;
  const fileName = document.file_name || "Unknown";

  await ctx.reply(
    "📦 فایل دریافت شد!\n\n" +
    `📄 Name: ${fileName}\n\n` +
    `🆔 File ID:\n${fileId}`
  );
});

// ===============================
// دانلود پنل
// ===============================

bot.action("download_panel", async (ctx) => {
  await ctx.answerCbQuery();

  const isMember = await checkMembership(ctx);

  if (!isMember) {
    const buttons = REQUIRED_CHANNELS.map((channel) => [
      Markup.button.url(
        `📢 عضویت در ${channel}`,
        `https://t.me/${channel.replace("@", "")}`
      )
    ]);

    buttons.push([
      Markup.button.callback(
        "✅ بررسی عضویت",
        "check_membership"
      )
    ]);

    return ctx.reply(
      "🔒 برای دریافت پنل ابتدا باید عضو کانال‌های زیر بشی:",
      Markup.inlineKeyboard(buttons)
    );
  }

  await ctx.reply(
    "✅ عضویت تأیید شد!\n\n" +
    "📥 پنل آماده دریافت است."
  );
});

// ===============================
// بررسی مجدد عضویت
// ===============================

bot.action("check_membership", async (ctx) => {
  await ctx.answerCbQuery();

  const isMember = await checkMembership(ctx);

  if (!isMember) {
    return ctx.reply(
      "❌ هنوز عضو همه کانال‌های موردنیاز نیستی."
    );
  }

  await ctx.reply(
    "✅ عضویت تأیید شد!\n\n" +
    "📥 حالا می‌تونی پنل رو دریافت کنی."
  );
});

// ===============================
// Sensitivity
// ===============================

bot.action("sensitivity", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "🎯 بخش Sensitivity\n\n" +
    "به‌زودی فعال میشه 🔥"
  );
});

// ===============================
// VIP Pack
// ===============================

bot.action("vip_pack", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "👑 VIP Pack\n\n" +
    "این بخش به‌زودی فعال میشه."
  );
});

// ===============================
// Support
// ===============================

bot.action("support", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "🆘 Support\n\n" +
    "پیامت رو برای پشتیبانی ارسال کن."
  );
});

// ===============================
// اجرای بات
// ===============================

bot.launch();

console.log("KX Panel Bot is running...");

// ===============================
// توقف صحیح بات
// ===============================

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
