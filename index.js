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
// منوی عضویت اجباری
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
// منوی پنل‌ها
// ===============================

function panelsKeyboard() {
  const panels = loadPanels();

  const buttons = Object.keys(panels).map((code) => [
    Markup.button.callback(
      `📦 ${panels[code].name}`,
      `panel_${code}`
    )
  ]);

  buttons.push([
    Markup.button.callback("🔙 بازگشت", "back_main")
  ]);

  return Markup.inlineKeyboard(buttons);
}

// ===============================
// /start
// ===============================

bot.start((ctx) => {
  ctx.reply(
    "🔥 به بات Kx خوش اومدی 🔥\n\n" +
    "💬 هر گزینه ای که میخوای رو انتخاب کن 💬",
    mainMenu
  );
});

// ===============================
// دانلود پنل
// ===============================

bot.action("download_panel", async (ctx) => {
  await ctx.answerCbQuery();

  const panels = loadPanels();

  if (Object.keys(panels).length === 0) {
    return ctx.reply(
      "📥 فعلاً هیچ پنلی برای دریافت وجود نداره."
    );
  }

  await ctx.reply(
    "📥 پنل موردنظرت رو انتخاب کن:",
    panelsKeyboard()
  );
});

// ===============================
// انتخاب پنل
// ===============================

bot.action(/^panel_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const panelCode = ctx.match[1];

  const panels = loadPanels();
  const panel = panels[panelCode];

  if (!panel) {
    return ctx.reply("❌ این پنل پیدا نشد.");
  }

  // بررسی عضویت
  const isMember = await checkMembership(ctx);

  if (!isMember) {
    return ctx.reply(
      "🔒 برای دریافت این پنل ابتدا باید عضو کانال‌های زیر بشی:",
      membershipKeyboard()
    );
  }

  // پیام درحال ارسال
  const sendingMessage = await ctx.reply(
    `📦 پنل درحال ارسال : ${panel.name}`
  );

  try {
    // ارسال فایل
    await ctx.replyWithDocument(panel.file_id);

    // حذف پیام درحال ارسال
    try {
      await ctx.deleteMessage(sendingMessage.message_id);
    } catch (error) {
      console.log(
        "Could not delete sending message:",
        error.message
      );
    }

    // پیام اطلاعات پنل
    await ctx.reply(
      `Name: ${panel.name}\n` +
      `Password: ${panel.password}\n\n` +
      `🔴 رمز فایل داخل ویدیو یوتیوب 🔴`
    );

  } catch (error) {
    console.log(
      "Panel sending error:",
      error.message
    );

    try {
      await ctx.deleteMessage(sendingMessage.message_id);
    } catch (e) {}

    await ctx.reply(
      "❌ هنگام ارسال پنل مشکلی پیش اومد. دوباره تلاش کن."
    );
  }
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
    "حالا از 📥 دانلود پنل، پنل موردنظرت رو انتخاب کن."
  );
});

// ===============================
// بازگشت به منوی اصلی
// ===============================

bot.action("back_main", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.reply(
    "🔥 به بات Kx خوش اومدی 🔥\n\n" +
    "💬 هر گزینه ای که میخوای رو انتخاب کن 💬",
    mainMenu
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
