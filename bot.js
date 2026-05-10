require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

/* ================= CONFIG ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

const PORT = process.env.PORT || 3000;
const ADMIN_ID = 7154361039;

const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());

/* ================= DB ================= */

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ DB Connected"));

/* ================= MODELS ================= */

const User = mongoose.model("User", {
  userId: String,

  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 },
  referredBy: String,

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  lastDaily: { type: Number, default: 0 },

  withdrawPending: { type: Boolean, default: false },
  banned: { type: Boolean, default: false }
});

const Withdraw = mongoose.model("Withdraw", {
  userId: String,
  amount: Number,
  status: { type: String, default: "pending" },
  createdAt: { type: Number, default: Date.now }
});

/* ================= HELPERS ================= */

function levelUp(xp) {
  return Math.floor(xp / 100) + 1;
}

function rateLimit(user) {
  const now = Date.now();
  if (user.lastAction && now - user.lastAction < 1500) return false;
  user.lastAction = now;
  return true;
}

function fraudCheck(user) {
  if (user.refs > 100 && user.balance < 50) return true;
  if (user.withdrawPending && user.balance > 1000) return true;
  return false;
}

/* ================= START ================= */

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const id = String(msg.chat.id);
  const param = match?.[1];

  let user = await User.findOne({ userId: id });

  if (!user) {
    user = await User.create({ userId: id });
  }

  /* REF SYSTEM */
  if (param && param.startsWith("ref")) {
    const ref = param.replace("ref", "");

    if (ref !== id && !user.referredBy) {
      const refUser = await User.findOne({ userId: ref });

      if (refUser) {
        user.referredBy = ref;

        refUser.refs += 1;
        refUser.balance += 10;
        refUser.xp += 15;
        refUser.level = levelUp(refUser.xp);

        await user.save();
        await refUser.save();
      }
    }
  }

  bot.sendMessage(id,
`🔥 MASTER PLATFORM BOT

💰 Balance: ${user.balance}
👥 Referrals: ${user.refs}
⭐ Level: ${user.level}

Commands:
/daily /balance /tasks /withdraw /top`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "💰 Balance", callback_data: "balance" }],
      [{ text: "🎁 Daily", callback_data: "daily" }],
      [{ text: "🎯 Tasks", callback_data: "tasks" }],
      [{ text: "🏆 Leaderboard", callback_data: "top" }]
    ]
  }
});
});

/* ================= CALLBACK ================= */

bot.on("callback_query", async (q) => {
  const id = String(q.message.chat.id);
  const user = await User.findOne({ userId: id });

  if (!user) return;

  if (!rateLimit(user)) {
    return bot.sendMessage(id, "⏳ Slow down");
  }

  /* BALANCE */
  if (q.data === "balance") {
    return bot.sendMessage(id, `💰 ${user.balance}`);
  }

  /* DAILY */
  if (q.data === "daily") {
    const now = Date.now();
    const day = 86400000;

    if (now - user.lastDaily < day)
      return bot.sendMessage(id, "⏳ Already claimed");

    user.balance += 5;
    user.xp += 10;
    user.lastDaily = now;

    user.level = levelUp(user.xp);

    await user.save();

    return bot.sendMessage(id, "🎁 +5 coins");
  }

  /* TASKS */
  if (q.data === "tasks") {
    user.balance += 10;
    user.xp += 10;

    user.level = levelUp(user.xp);

    await user.save();

    return bot.sendMessage(id, "🎯 Task completed +10 coins");
  }

  /* TOP */
  if (q.data === "top") {
    const top = await User.find().sort({ balance: -1 }).limit(10);

    let text = "🏆 TOP USERS\n\n";

    top.forEach((u, i) => {
      text += `${i + 1}. ${u.userId} - ${u.balance}\n`;
    });

    return bot.sendMessage(id, text);
  }
});

/* ================= WITHDRAW ================= */

bot.onText(/\/withdraw (.+)/, async (msg, match) => {
  const id = String(msg.chat.id);
  const amount = Number(match[1]);

  const user = await User.findOne({ userId: id });

  if (!user || user.balance < amount)
    return bot.sendMessage(id, "❌ Not enough balance");

  if (fraudCheck(user))
    return bot.sendMessage(id, "🚫 Account flagged");

  await Withdraw.create({
    userId: id,
    amount
  });

  user.withdrawPending = true;
  await user.save();

  io.emit("withdraw:new", { id, amount });

  bot.sendMessage(id, "📤 Sent to admin");
});

/* ================= ADMIN ================= */

bot.onText(/\/approve (.+) (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const id = match[1];
  const amount = Number(match[2]);

  const user = await User.findOne({ userId: id });

  if (!user) return;

  user.balance -= amount;
  user.withdrawPending = false;

  await user.save();

  bot.sendMessage(id, `✅ Paid ${amount}`);
});

bot.onText(/\/reject (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const id = match[1];

  const user = await User.findOne({ userId: id });

  if (!user) return;

  user.withdrawPending = false;
  await user.save();

  bot.sendMessage(id, "❌ Rejected");
});

/* ================= ADMIN BROADCAST ================= */

bot.onText(/\/post (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text = match[1];

  const users = await User.find();

  users.forEach(u => {
    bot.sendMessage(u.userId, `📢 ${text}`).catch(() => {});
  });

  bot.sendMessage(ADMIN_ID, "✅ Broadcast sent");
});

/* ================= API ================= */

app.get("/api/stats", async (req, res) => {
  const users = await User.countDocuments();

  const all = await User.find();

  let balance = 0;

  all.forEach(u => balance += u.balance);

  res.json({
    users,
    totalBalance: balance
  });
});

/* ================= SERVER ================= */

server.listen(PORT, () => {
  console.log("🚀 MASTER SYSTEM RUNNING");
});
