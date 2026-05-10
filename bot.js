require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

/* ================= CONFIG ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 7154361039;

const CHANNEL = "@gangs234";
const GROUP_ID = "-1003984859530";

/* ================= INIT ================= */

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

app.use(express.json());

/* ================= DB ================= */

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DB Connected"));

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 }
});

/* ================= SERVER ================= */

app.get("/", (req, res) => {
  res.send("🚀 Bot Running");
});

/* ================= POST HELPER ================= */

async function postAll(text) {
  try {
    await bot.sendMessage(CHANNEL, text, { parse_mode: "Markdown" });
    await bot.sendMessage(GROUP_ID, text, { parse_mode: "Markdown" });
  } catch (e) {
    console.log("POST ERROR:", e.message);
  }
}

/* ================= START ================= */

bot.onText(/\/start/, async (msg) => {
  const id = String(msg.chat.id);

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  bot.sendMessage(id,
`🔥 WELCOME TO BOT

💰 Balance: ${user.balance}
👥 Referrals: ${user.refs}

Choose action 👇`,
{
  reply_markup: {
    inline_keyboard: [
      [
        { text: "🚀 Start Bot", callback_data: "start_bot" }
      ],
      [
        { text: "💰 Balance", callback_data: "balance" },
        { text: "👥 Referrals", callback_data: "refs" }
      ],
      [
        { text: "🏆 Top Users", callback_data: "top" }
      ],
      [
        { text: "📢 Join Channel", url: "https://t.me/gangs234" }
      ]
    ]
  }
});
});

/* ================= CALLBACKS ================= */

bot.on("callback_query", async (q) => {
  const id = String(q.message.chat.id);
  const user = await User.findOne({ userId: id });

  if (!user) return;

  if (q.data === "start_bot") {
    return bot.sendMessage(id, "🚀 Bot Started Successfully!");
  }

  if (q.data === "balance") {
    return bot.sendMessage(id, `💰 Balance: ${user.balance}`);
  }

  if (q.data === "refs") {
    const link = `https://t.me/YourBot?start=ref${id}`;

    return bot.sendMessage(id,
`👥 REF INFO

👥 Referrals: ${user.refs}

🔗 Link:
${link}`);
  }

  if (q.data === "top") {
    const top = await User.find().sort({ balance: -1 }).limit(10);

    let text = "🏆 TOP USERS\n\n";

    top.forEach((u, i) => {
      text += `${i + 1}. ${u.userId} - 💰 ${u.balance}\n`;
    });

    return bot.sendMessage(id, text);
  }

  bot.answerCallbackQuery(q.id).catch(() => {});
});

/* ================= REF COMMAND ================= */

bot.onText(/\/ref/, async (msg) => {
  const id = String(msg.chat.id);

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  const link = `https://t.me/YourBot?start=ref${id}`;

  bot.sendMessage(id,
`👥 REF SYSTEM

🔗 Link:
${link}

👥 Referrals: ${user.refs}`);
});

/* ================= POST COMMAND ================= */

bot.onText(/\/post (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text = match[1];

  await postAll(`📢 *UPDATE*\n\n${text}`);

  bot.sendMessage(ADMIN_ID, "✅ Posted");
});

/* ================= POST TOP ================= */

bot.onText(/\/posttop/, async (msg) => {
  if (msg.chat.id != ADMIN_ID) return;

  const top = await User.find().sort({ balance: -1 }).limit(10);

  let text = "🏆 TOP USERS\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. ${u.userId} - 💰 ${u.balance}\n`;
  });

  await postAll(text);

  bot.sendMessage(ADMIN_ID, "✅ Leaderboard posted");
});

/* ================= ACTIVE ================= */

bot.onText(/\/active/, async (msg) => {
  if (msg.chat.id != ADMIN_ID) return;

  const total = await User.countDocuments();

  const text =
`🔥 ACTIVE REPORT

👥 Users: ${total}
🚀 System running strong`;

  await postAll(text);

  bot.sendMessage(ADMIN_ID, "✅ Active posted");
});

/* ================= MOTIVATE ================= */

bot.onText(/\/motivate/, async (msg) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text =
`🚀 MOTIVATION

💰 Invite friends
🏆 Reach leaderboard
🎁 Earn rewards`;

  await postAll(text);

  bot.sendMessage(ADMIN_ID, "✅ Motivation sent");
});

/* ================= SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
