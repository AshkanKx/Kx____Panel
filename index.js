const { Telegraf, Markup } = require("telegraf");
const http = require("http");
const fs = require("fs");

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
// خواندن پنل‌ها
// ===============================

function loadPanels() {
  try {
    const data = fs.readFileSync("./panels.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.log("Could not load panels.json:", error.message);
    return {};
  }
}

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
// کیبورد عضویت
// ===============================

function membershipKeyboard() {
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

  return Markup.inlineKeyboard(buttons);
}

// ===============================
// ارسال پنل
// ===============================

async function sendPanel(ctx, panelCode) {
  const panels = loadPanels();
  const panel = panels[panelCode];

  if (!panel) {
    return ctx.reply(
      "❌ این پنل پیدا نشد یا لینک آن اشتباه است."
    );
  }

  await ctx.reply(
    `📦 ${panel.name}\n\n` +
    "⏳ در حال ارسال پنل..."
  );

  await ctx.replyWithDocument(panel.file_id, {
    caption:
      `🔥 ${panel.name}\n\n` +
      "✅ پنل با موفقیت ارسال شد.\n" +
      "❤️ ASHKAN KX"
  });
}

// ===============================
// /start
// ===============================

bot.start(async (ctx) => {
  const startPayload = ctx.startPayload;

  // لینک اختصاصی پنل
  if (startPayload) {
    const panels = loadPanels();

    if (panels[startPayload]) {
      const isMember = await checkMembership(ctx);

      if (!isMember) {
        return ctx.reply(
          "🔒 برای دریافت این پنل ابتدا باید عضو کانال‌های زیر بشی:",
          membershipKeyboard()
        );
      }

      return sendPanel(ctx, startPayload);
    }
  }

  // /start معمولی
  await ctx.reply(
    "🔥 به ASHKAN KX خوش اومدی!\n\n" +
    "🎮 مرکز دریافت پنل و تنظیمات KX\n\n" +
    "یکی از گزینه‌های زیر رو انتخاب کن:",
    mainMenu
  );
});

// ===============================
// دانلود پنل
// ===============================

bot.action("download_panel", async (ctx) => {
  await ctx.answerCbQuery();

  const isMember = await checkMembership(ctx);

  if (!isMember) {
    return ctx.reply(
      "🔒 برای دریافت پنل ابتدا باید عضو کانال‌های زیر بشی:",
      membershipKeyboard()
    );
  }

  await ctx.reply(
    "📥 برای دریافت پنل، لینک اختصاصی همان ویدیو رو باز کن."
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
      "❌ هنوز عضو همه کانال‌های موردنیاز نیستی.",
      membershipKeyboard()
    );
  }

  await ctx.reply(
    "✅ عضویت تأیید شد!\n\n" +
    "حالا لینک پنل رو دوباره باز کن تا فایل برات ارسال بشه."
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
// دریافت فایل و نمایش File ID
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
// اجرای بات
// ===============================

bot.launch();

console.log("KX Panel Bot is running...");

// ===============================
// توقف صحیح
// ===============================

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
