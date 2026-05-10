const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

const token = process.env.BOT_TOKEN;
const MONGO_URL = process.env.MONGO_URL;

if (!token || !MONGO_URL) {
  console.log("❌ Missing env variables");
  process.exit(1);
}

/* ================= DB ================= */
mongoose.connect(MONGO_URL)
  .then(() => console.log("✅ DB Connected"));

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 },
  referredBy: String,
  joinTime: { type: Number, default: Date.now }
});

/* ================= BOT ================= */
const bot = new TelegramBot(token, { polling: true });

const BOT_USERNAME = "Studybuddy_2025Bot";
const ADMIN_ID = 7154361039;
const CHANNEL = "@gangs234";
const MINI_APP = "https://myapp1-khaki.vercel.app/";

/* ================= HELPERS ================= */
function getLink(id) {
  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;
}

/* ================= CHANNEL CHECK ================= */
async function isMember(userId) {
  try {
    const res = await bot.getChatMember(CHANNEL, userId);
    return ["member", "creator", "administrator"].includes(res.status);
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

  const link = getLink(chatId);

  bot.sendMessage(chatId,
`🔥 WELCOME

💰 Balance: ${user.balance}
👥 Referrals: ${user.refs}

🔗 ${link}`,
{
  reply_markup: {
    inline_keyboard: [
      [{ text: "Open App", web_app: { url: MINI_APP } }],
      [{ text: "Referral Link", url: link }],
      [{ text: "Balance", callback_data: "balance" }]
    ]
  }
});
});

/* ================= CALLBACK ================= */
bot.on("callback_query", async (q) => {

  const id = String(q.message.chat.id);
  const user = await User.findOne({ userId: id });

  if (q.data === "balance") {
    bot.sendMessage(id, `💰 Balance: ${user?.balance || 0}`);
  }

  bot.answerCallbackQuery(q.id);
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
`💸 Withdraw request
User: ${id}
Amount: ${amount}`);

  bot.sendMessage(id, "⏳ Request sent");
});

/* ================= LEADERBOARD ================= */
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

app.get("/leaderboard", async (req, res) => {

  const users = await User.find()
    .sort({ balance: -1 })
    .limit(10);

  res.json(users);
});

/* ================= SERVER ================= */
app.listen(3000, () => {
  console.log("🚀 Bot running");
});
