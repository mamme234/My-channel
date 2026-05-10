require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

/* ================= CONFIG ================= */
const token = process.env.BOT_TOKEN;
const mongo = process.env.MONGO_URL;
const PORT = process.env.PORT || 3000;

if (!token || !mongo) {
  console.log("❌ Missing env variables");
  process.exit(1);
}

/* ================= MONGODB ================= */
mongoose.connect(mongo)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error:", err));

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 },
  referredBy: { type: String, default: null }
});

/* ================= BOT ================= */
const bot = new TelegramBot(token, {
  polling: {
    autoStart: true,
    interval: 1000
  }
});

const BOT_USERNAME = "Studybuddy_2025Bot";
const ADMIN_ID = 7154361039;
const CHANNEL = "@gangs234";
const MINI_APP = "https://myapp1-khaki.vercel.app/";

/* ================= EXPRESS ================= */
const app = express();
app.use(express.json());

/* ================= HELPERS ================= */
function getRefLink(id) {
  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;
}

/* ================= CHANNEL CHECK ================= */
async function isMember(id) {
  try {
    const res = await bot.getChatMember(CHANNEL, id);
    return ["member", "administrator", "creator"].includes(res.status);
  } catch {
    return false;
  }
}

/* ================= START ================= */
bot.onText(/\/start(?: (.+))?/, async (msg, match) => {

  const chatId = String(msg.chat.id);
  const param = match?.[1];

  if (!(await isMember(chatId))) {
    return bot.sendMessage(chatId,
      "⚠️ Join channel first",
      {
        reply_markup: {
          inline_keyboard: [[
            { text: "Join Channel", url: "https://t.me/gangs234" }
          ]]
        }
      }
    );
  }

  let user = await User.findOne({ userId: chatId });

  if (!user) {
    user = await User.create({ userId: chatId });
  }

  /* ================= REFERRAL ================= */
  if (param?.startsWith("ref")) {

    const refId = param.replace("ref", "");

    if (refId !== chatId && !user.referredBy) {

      const refUser = await User.findOne({ userId: refId });

      if (refUser) {

        user.referredBy = refId;

        refUser.refs += 1;
        refUser.balance += 10;

        await user.save();
        await refUser.save();

        bot.sendMessage(refId, "🎉 +10 coins from referral!");
      }
    }
  }

  const link = getRefLink(chatId);

  bot.sendMessage(chatId,
`🔥 WELCOME

💰 Balance: ${user.balance}
👥 Referrals: ${user.refs}

🔗 Referral Link:
${link}`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "🚀 Open App", web_app: { url: MINI_APP } }],
      [{ text: "🔗 Share Link", url: link }]
    ]
  }
});

});

/* ================= BALANCE ================= */
bot.onText(/\/balance/, async (msg) => {

  const user = await User.findOne({ userId: String(msg.chat.id) });

  bot.sendMessage(msg.chat.id,
`💰 Balance: ${user?.balance || 0}`);
});

/* ================= TOP USERS ================= */
bot.onText(/\/top/, async (msg) => {

  const top = await User.find()
    .sort({ balance: -1 })
    .limit(10);

  let text = "🏆 TOP USERS\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. ${u.userId} - ${u.balance} 💰\n`;
  });

  bot.sendMessage(msg.chat.id, text);
});

/* ================= WITHDRAW ================= */
bot.onText(/\/withdraw (.+)/, async (msg, match) => {

  const id = String(msg.chat.id);
  const amount = Number(match[1]);

  const user = await User.findOne({ userId: id });

  if (!user || user.balance < amount) {
    return bot.sendMessage(id, "❌ Not enough balance");
  }

  user.balance -= amount;
  await user.save();

  bot.sendMessage(ADMIN_ID,
`💸 Withdraw Request
User: ${id}
Amount: ${amount}`);

  bot.sendMessage(id, "⏳ Sent to admin");
});

/* ================= API FOR VERCEL ================= */
app.get("/user/:id", async (req, res) => {

  const user = await User.findOne({ userId: req.params.id });

  if (!user) return res.json({ ok: false });

  res.json({
    ok: true,
    balance: user.balance,
    refs: user.refs
  });
});

/* ================= SERVER ================= */
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});
