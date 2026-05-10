require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

/* ================= CONFIG ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

const ADMIN_ID = 7154361039;

/* ================= INIT ================= */

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const app = express();

app.use(express.json());

/* ================= DB ================= */

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.log("❌ DB Error", err));

/* ================= USER MODEL ================= */

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 },
  referredBy: String,

  xp: { type: Number, default: 0 },
  level: { type: Number, default: 1 },

  lastDaily: { type: Number, default: 0 },
  withdrawPending: { type: Boolean, default: false }
});

/* ================= HELPERS ================= */

function levelUp(xp) {
  return Math.floor(xp / 100) + 1;
}

/* ================= EXPRESS ================= */

app.get("/", (req, res) => {
  res.send("🚀 Bot is running");
});

/* ================= START COMMAND ================= */

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const id = String(msg.chat.id);
  const param = match?.[1];

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  /* REF SYSTEM */
  if (param && param.startsWith("ref")) {
    const ref = param.replace("ref", "");

    if (ref !== id && !user.referredBy) {
      const refUser = await User.findOne({ userId: ref });

      if (refUser) {
        user.referredBy = ref;

        refUser.refs += 1;
        refUser.balance += 10;
        refUser.xp += 10;
        refUser.level = levelUp(refUser.xp);

        await refUser.save();
        await user.save();
      }
    }
  }

  bot.sendMessage(id,
`🔥 WELCOME BOT

💰 Balance: ${user.balance}
👥 Referrals: ${user.refs}
⭐ Level: ${user.level}

Commands:
/daily /balance /withdraw /ref`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "💰 Balance", callback_data: "balance" }],
      [{ text: "🎁 Daily", callback_data: "daily" }]
    ]
  }
});
});

/* ================= CALLBACKS ================= */

bot.on("callback_query", async (q) => {
  const id = String(q.message.chat.id);
  const user = await User.findOne({ userId: id });

  if (!user) return;

  /* BALANCE */
  if (q.data === "balance") {
    return bot.sendMessage(id, `💰 Balance: ${user.balance}`);
  }

  /* DAILY REWARD */
  if (q.data === "daily") {
    const now = Date.now();
    const day = 86400000;

    if (now - user.lastDaily < day)
      return bot.sendMessage(id, "⏳ Already claimed");

    user.balance += 5;
    user.xp += 5;
    user.lastDaily = now;

    user.level = levelUp(user.xp);

    await user.save();

    return bot.sendMessage(id, "🎁 +5 coins added");
  }
});

/* ================= BALANCE ================= */

bot.onText(/\/balance/, async (msg) => {
  const user = await User.findOne({ userId: String(msg.chat.id) });

  bot.sendMessage(msg.chat.id, `💰 Balance: ${user?.balance || 0}`);
});

/* ================= REF LINK ================= */

bot.onText(/\/ref/, async (msg) => {
  const id = String(msg.chat.id);

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  const link = `https://t.me/YourBot?start=ref${id}`;

  bot.sendMessage(id,
`👥 REF INFO

🔗 Your link:
${link}

👥 Referrals: ${user.refs}`);
});

/* ================= WITHDRAW ================= */

bot.onText(/\/withdraw (.+)/, async (msg, match) => {
  const id = String(msg.chat.id);
  const amount = Number(match[1]);

  const user = await User.findOne({ userId: id });

  if (!user || user.balance < amount)
    return bot.sendMessage(id, "❌ Not enough balance");

  user.withdrawPending = true;
  await user.save();

  bot.sendMessage(ADMIN_ID,
`💳 WITHDRAW REQUEST

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

  user.balance -= amount;
  user.withdrawPending = false;

  await user.save();

  bot.sendMessage(id, `✅ Approved ${amount}`);
});

/* ================= ADMIN REJECT ================= */

bot.onText(/\/reject (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const id = match[1];

  const user = await User.findOne({ userId: id });

  user.withdrawPending = false;
  await user.save();

  bot.sendMessage(id, "❌ Rejected");
});

/* ================= SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
