const { Telegraf, Markup } = require("telegraf");
const http = require("http");
const fs = require("fs");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Telegraf(BOT_TOKEN);

// ==========================================
// کانال‌های عضویت اجباری
// ==========================================

const REQUIRED_CHANNELS = [
  "@AshkanKx",
  "@AshkanKx2"
];

// ==========================================
// خواندن panels.json
// ==========================================

function loadPanels() {
  try {
    const data = fs.readFileSync("./panels.json", "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.log("Error loading panels.json:", error.message);
    return {};
  }
}

// ==========================================
// متن منوی اصلی
// ==========================================

const MAIN_TEXT =
  "🔥 به بات Kx خوش اومدی 🔥\n\n" +
  "💬 هر گزینه ای که میخوای رو انتخاب کن 💬";

// ==========================================
// سرور Render
// ==========================================

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

// ==========================================
// منوی اصلی
// ==========================================

function mainKeyboard() {
  return Markup.inlineKeyboard([
    [
      Markup.button.callback(
        "📥 دانلود پنل",
        "download_panel"
      ),
      Markup.button.callback(
        "🎯 Sensitivity",
        "sensitivity"
      )
    ],
    [
      Markup.button.callback(
        "👑 VIP Pack",
        "vip_pack"
      ),
      Markup.button.callback(
        "🆘 Support",
        "support"
      )
    ]
  ]);
}

// ==========================================
// منوی پنل‌ها
// ==========================================

function panelsKeyboard() {
  const panels = loadPanels();

  const buttons = Object.keys(panels).map((code) => [
    Markup.button.callback(
      `📦 ${panels[code].name}`,
      `panel_${code}`
    )
  ]);

  buttons.push([
    Markup.button.callback(
      "🔙 بازگشت",
      "back_main"
    )
  ]);

  return Markup.inlineKeyboard(buttons);
}

// ==========================================
// منوی عضویت اجباری
// ==========================================

function membershipKeyboard(panelCode) {
  const buttons = REQUIRED_CHANNELS.map((channel) => [
    Markup.button.url(
      `📢 عضویت در ${channel}`,
      `https://t.me/${channel.replace("@", "")}`
    )
  ]);

  buttons.push([
    Markup.button.callback(
      "✅ بررسی عضویت",
      `check_membership_${panelCode}`
    )
  ]);

  buttons.push([
    Markup.button.callback(
      "🔙 بازگشت",
      "download_panel"
    )
  ]);

  return Markup.inlineKeyboard(buttons);
}

// ==========================================
// بررسی عضویت
// ==========================================

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
        `Membership check error ${channel}:`,
        error.message
      );

      return false;
    }
  }

  return true;
}

// ==========================================
// نمایش منوی اصلی
// ==========================================

async function showMainMenu(ctx) {
  try {
    await ctx.editMessageText(
      MAIN_TEXT,
      mainKeyboard()
    );
  } catch (error) {
    // اگر پیام قابل ویرایش نبود
    await ctx.reply(
      MAIN_TEXT,
      mainKeyboard()
    );
  }
}

// ==========================================
// نمایش منوی پنل‌ها
// ==========================================

async function showPanelsMenu(ctx) {
  const panels = loadPanels();

  if (Object.keys(panels).length === 0) {
    return ctx.editMessageText(
      "📥 فعلاً هیچ پنلی برای دریافت وجود نداره.",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔙 بازگشت",
            "back_main"
          )
        ]
      ])
    );
  }

  await ctx.editMessageText(
    "📥 پنل موردنظرت رو انتخاب کن:",
    panelsKeyboard()
  );
}

// ==========================================
// /start
// ==========================================

bot.start(async (ctx) => {
  await ctx.reply(
    MAIN_TEXT,
    mainKeyboard()
  );
});

// ==========================================
// 📥 دانلود پنل
// ==========================================

bot.action("download_panel", async (ctx) => {
  await ctx.answerCbQuery();

  await showPanelsMenu(ctx);
});

// ==========================================
// انتخاب پنل
// ==========================================

bot.action(/^panel_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const panelCode = ctx.match[1];

  const panels = loadPanels();
  const panel = panels[panelCode];

  if (!panel) {
    return ctx.editMessageText(
      "❌ این پنل پیدا نشد.",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔙 بازگشت",
            "download_panel"
          )
        ]
      ])
    );
  }

  // بررسی عضویت
  const isMember = await checkMembership(ctx);

  if (!isMember) {
    return ctx.editMessageText(
      "🔒 برای دریافت این پنل ابتدا باید عضو کانال‌های زیر بشی:",
      membershipKeyboard(panelCode)
    );
  }

  await sendPanel(ctx, panelCode);
});

// ==========================================
// بررسی مجدد عضویت
// ==========================================

bot.action(/^check_membership_(.+)$/, async (ctx) => {
  await ctx.answerCbQuery();

  const panelCode = ctx.match[1];

  const panels = loadPanels();
  const panel = panels[panelCode];

  if (!panel) {
    return ctx.editMessageText(
      "❌ این پنل پیدا نشد.",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔙 بازگشت",
            "download_panel"
          )
        ]
      ])
    );
  }

  const isMember = await checkMembership(ctx);

  if (!isMember) {
    return ctx.editMessageText(
      "❌ هنوز عضو همه کانال‌های موردنیاز نیستی.",
      membershipKeyboard(panelCode)
    );
  }

  // عضویت تأیید شد → ارسال پنل
  await sendPanel(ctx, panelCode);
});

// ==========================================
// ارسال پنل
// ==========================================

async function sendPanel(ctx, panelCode) {
  const panels = loadPanels();
  const panel = panels[panelCode];

  if (!panel) {
    return ctx.editMessageText(
      "❌ این پنل پیدا نشد.",
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔙 بازگشت",
            "download_panel"
          )
        ]
      ])
    );
  }

  // پیام درحال ارسال
  await ctx.editMessageText(
    `📦 پنل درحال ارسال : ${panel.name}`
  );

  try {

    // ارسال فایل
    await ctx.replyWithDocument(
      panel.file_id
    );

    // حذف پیام قبلی «درحال ارسال»
    try {
      await ctx.deleteMessage(
        ctx.callbackQuery.message.message_id
      );
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
      `🔴 رمز فایل داخل ویدیو یوتیوب 🔴`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            "🔙 بازگشت به پنل‌ها",
            "download_panel"
          )
        ]
      ])
    );

  } catch (error) {

    console.log(
      "Panel sending error:",
      error.message
    );

    // اگر ارسال فایل شکست خورد
    try {
      await ctx.editMessageText(
        "❌ هنگام ارسال پنل مشکلی پیش اومد.",
        Markup.inlineKeyboard([
          [
            Markup.button.callback(
              "🔙 بازگشت به پنل‌ها",
              "download_panel"
            )
          ]
        ])
      );
    } catch (e) {}

  }
}

// ==========================================
// 🔙 بازگشت به منوی اصلی
// ==========================================

bot.action("back_main", async (ctx) => {
  await ctx.answerCbQuery();

  await showMainMenu(ctx);
});

// ==========================================
// 🎯 Sensitivity
// ==========================================

bot.action("sensitivity", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "🎯 Sensitivity\n\n" +
    "این بخش به‌زودی فعال میشه 🔥",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "🔙 بازگشت",
          "back_main"
        )
      ]
    ])
  );
});

// ==========================================
// 👑 VIP Pack
// ==========================================

bot.action("vip_pack", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "👑 VIP Pack\n\n" +
    "این بخش به‌زودی فعال میشه 🔥",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "🔙 بازگشت",
          "back_main"
        )
      ]
    ])
  );
});

// ==========================================
// 🆘 Support
// ==========================================

bot.action("support", async (ctx) => {
  await ctx.answerCbQuery();

  await ctx.editMessageText(
    "🆘 Support\n\n" +
    "برای ارتباط با ادمین از طریق پشتیبانی پیام بفرست.",
    Markup.inlineKeyboard([
      [
        Markup.button.callback(
          "🔙 بازگشت",
          "back_main"
        )
      ]
    ])
  );
});

// ==========================================
// دریافت فایل و نمایش File ID
// ==========================================

bot.on("document", async (ctx) => {
  const document = ctx.message.document;

  const fileId = document.file_id;
  const fileName =
    document.file_name || "Unknown";

  await ctx.reply(
    "📦 فایل دریافت شد!\n\n" +
    `📄 Name: ${fileName}\n\n` +
    `🆔 File ID:\n${fileId}`
  );
});

// ==========================================
// اجرای بات
// ==========================================

bot.launch();

console.log(
  "KX Panel Bot is running..."
);

// ==========================================
// توقف صحیح
// ==========================================

process.once(
  "SIGINT",
  () => bot.stop("SIGINT")
);

process.once(
  "SIGTERM",
  () => bot.stop("SIGTERM")
);
