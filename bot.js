require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

/* ================= CONFIG ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

const PORT = process.env.PORT || 3000;

const ADMIN_ID = 7154361039;

const BOT_USERNAME = "Studybuddy_2025Bot";
const WEB_APP_URL = "https://myapp1-khaki.vercel.app/";

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

/* ================= HELPERS ================= */

/* POST TO CHANNEL + GROUP */
async function postToAll(text) {
  const channelKeyboard = {
    inline_keyboard: [
      [
        {
          text: "🚀 Start Bot",
          url: `https://t.me/${BOT_USERNAME}`
        }
      ]
    ]
  };

  try {
    await bot.sendMessage("@YOUR_CHANNEL", text, {
      reply_markup: channelKeyboard,
      parse_mode: "Markdown"
    });

    await bot.sendMessage("-100YOUR_GROUP_ID", text, {
      reply_markup: channelKeyboard,
      parse_mode: "Markdown"
    });
  } catch (e) {
    console.log("POST ERROR:", e.message);
  }
}

/* ================= START COMMAND ================= */

bot.onText(/\/start/, async (msg) => {
  const id = String(msg.chat.id);

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  bot.sendMessage(id,
`🔥 WELCOME

💰 Balance: ${user.balance}
👥 Referrals: ${user.refs}

Choose option 👇`,
{
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🚀 Start App",
          web_app: {
            url: WEB_APP_URL
          }
        }
      ],
      [
        {
          text: "💰 Balance",
          callback_data: "balance"
        }
      ],
      [
        {
          text: "👥 Referrals",
          callback_data: "refs"
        }
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

  if (q.data === "balance") {
    return bot.sendMessage(id, `💰 Balance: ${user.balance}`);
  }

  if (q.data === "refs") {
    const link = `https://t.me/${BOT_USERNAME}?start=ref${id}`;

    return bot.sendMessage(id,
`👥 REF SYSTEM

👥 Referrals: ${user.refs}

🔗 Link:
${link}`);
  }

  bot.answerCallbackQuery(q.id).catch(() => {});
});

/* ================= REF SYSTEM ================= */

bot.onText(/\/ref/, async (msg) => {
  const id = String(msg.chat.id);

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  const link = `https://t.me/${BOT_USERNAME}?start=ref${id}`;

  bot.sendMessage(id,
`👥 REF INFO

🔗 Your link:
${link}

👥 Referrals: ${user.refs}`);
});

/* ================= ADMIN POST ================= */

bot.onText(/\/post (.+)/, async (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text = match[1];

  await postToAll(`📢 *UPDATE*\n\n${text}`);

  bot.sendMessage(ADMIN_ID, "✅ Posted to channel + group");
});

/* ================= POST TOP ================= */

bot.onText(/\/posttop/, async (msg) => {
  if (msg.chat.id != ADMIN_ID) return;

  const top = await User.find().sort({ balance: -1 }).limit(10);

  let text = "🏆 TOP USERS\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. ${u.userId} - 💰 ${u.balance}\n`;
  });

  await postToAll(text);

  bot.sendMessage(ADMIN_ID, "✅ Leaderboard posted");
});

/* ================= ACTIVE ================= */

bot.onText(/\/active/, async (msg) => {
  if (msg.chat.id != ADMIN_ID) return;

  const total = await User.countDocuments();

  const text =
`🔥 ACTIVE REPORT

👥 Users: ${total}
🚀 System running`;

  await postToAll(text);

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

  await postToAll(text);

  bot.sendMessage(ADMIN_ID, "✅ Motivation sent");
});

/* ================= SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
