const { Telegraf } = require("telegraf");
const http = require("http");

const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("BOT_TOKEN is not set");
}

const bot = new Telegraf(BOT_TOKEN);

bot.start((ctx) => {
  ctx.reply("🔥 به ASHKAN KX خوش اومدی!");
});

// HTTP server برای Render
const PORT = process.env.PORT || 10000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end("KX Panel Bot is alive 🔥");
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`HTTP server running on port ${PORT}`);
});

bot.launch();

console.log("KX Panel Bot is running...");
