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

/* ================= USER MODEL ================= */

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 }
});

/* ================= SERVER ================= */

app.get("/", (req, res) => {
  res.send("🚀 Bot Running");
});

/* ================= HELPER: POST ================= */

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
`🔥 WELCOME

💰 Balance: ${user.balance}
👥 Ref: ${user.refs}

Commands:
/ref /balance /withdraw`);
});

/* ================= REF ================= */

bot.onText(/\/ref/, async (msg) => {
  const id = String(msg.chat.id);

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  const link = `https://t.me/@Studybuddy_2025Bot?start=ref${id}`;

  bot.sendMessage(id,
`👥 REF SYSTEM

🔗 Link:
${link}

👥 Referrals: ${user.refs}`);
});

/* ================= BALANCE ================= */

bot.onText(/\/balance/, async (msg) => {
  const user = await User.findOne({ userId: String(msg.chat.id) });

  bot.sendMessage(msg.chat.id,
`💰 Balance: ${user?.balance || 0}`);
});

/* ================= /POST ================= */

bot.onText(/\/post (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text = match[1];

  await postAll(`📢 *UPDATE*\n\n${text}`);

  bot.sendMessage(ADMIN_ID, "✅ Posted to channel & group");
});

/* ================= /POSTTOP ================= */

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

/* ================= /ACTIVE ================= */

bot.onText(/\/active/, async (msg) => {
  if (msg.chat.id != ADMIN_ID) return;

  const total = await User.countDocuments();

  const text =
`🔥 DAILY ACTIVE REPORT

👥 Users: ${total}
🚀 System Active
💰 Keep earning!`;

  await postAll(text);

  bot.sendMessage(ADMIN_ID, "✅ Active report sent");
});

/* ================= /MOTIVATE ================= */

bot.onText(/\/motivate/, async (msg) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text =
`🚀 MOTIVATION

💰 Invite friends
🏆 Reach top
🎁 Earn daily rewards`;

  await postAll(text);

  bot.sendMessage(ADMIN_ID, "✅ Motivation sent");
});

/* ================= WITHDRAW (OPTIONAL BASIC) ================= */

bot.onText(/\/withdraw (.+)/, async (msg, match) => {
  const id = String(msg.chat.id);
  const amount = Number(match[1]);

  const user = await User.findOne({ userId: id });

  if (!user || user.balance < amount)
    return bot.sendMessage(id, "❌ Not enough balance");

  bot.sendMessage(ADMIN_ID,
`💸 WITHDRAW

User: ${id}
Amount: ${amount}

Approve:
/approve ${id} ${amount}`);

  bot.sendMessage(id, "📤 Sent to admin");
});

/* ================= ADMIN APPROVE ================= */

bot.onText(/\/approve (.+) (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const id = match[1];
  const amount = Number(match[2]);

  const user = await User.findOne({ userId: id });

  if (!user) return;

  user.balance -= amount;
  await user.save();

  bot.sendMessage(id, `✅ Approved ${amount}`);
});

/* ================= SERVER START ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
