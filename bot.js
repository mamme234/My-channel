require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

/* =======================
   CONFIG
======================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

const BOT_USERNAME = "Studybuddy_2025Bot";

const CHANNEL = "@gangs234";
const GROUP_ID = "-1003984859530";

const ADMIN_ID = 7154361039;

/* ================= CHECK ================= */

if (!BOT_TOKEN || !MONGO_URI) {
  console.log("❌ Missing env variables");
  process.exit(1);
}

/* ================= DATABASE ================= */

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ Mongo Error", err));

/* ================= MODEL ================= */

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 },
  referredBy: { type: String, default: null },
  joinTime: { type: Number, default: Date.now }
});

/* ================= EXPRESS ================= */

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("🚀 StudyBuddy Bot Running");
});

/* ================= BOT ================= */

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
bot.deleteWebHook().catch(() => {});

/* ================= HELPERS ================= */

function getRefLink(id) {
  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;
}

async function checkJoin(id) {
  try {
    const member = await bot.getChatMember(CHANNEL, id);
    return ["member", "administrator", "creator"].includes(member.status);
  } catch {
    return false;
  }
}

/* ================= START COMMAND ================= */

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const chatId = String(msg.chat.id);
  const param = match?.[1];

  const joined = await checkJoin(chatId);

  if (!joined) {
    return bot.sendMessage(chatId, "⚠️ Join channel first", {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "📢 Join Channel",
              url: "https://t.me/gangs234"
            }
          ]
        ]
      }
    });
  }

  let user = await User.findOne({ userId: chatId });

  if (!user) {
    user = await User.create({ userId: chatId });
  }

  /* ================= REF SYSTEM ================= */

  if (param && param.startsWith("ref")) {
    const refId = param.replace("ref", "");

    if (refId !== chatId && !user.referredBy) {
      const refUser = await User.findOne({ userId: refId });

      if (refUser) {
        user.referredBy = refId;
        refUser.refs += 1;
        refUser.balance += 10;

        await user.save();
        await refUser.save();

        bot.sendMessage(refId, "🎉 You earned +10 coins from referral!");
      }
    }
  }

  const link = getRefLink(chatId);

  /* ================= FIXED KEYBOARD ================= */

  bot.sendMessage(chatId,
`🔥 *WELCOME TO STUDYBUDDY* 🔥

💰 Balance: *${user.balance} coins*
👥 Referrals: *${user.refs}*

🔗 Your Referral Link:
${link}

🚀 Press button below to start earning!`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🚀 Start Bot",
          callback_data: "start_bot"
        }
      ],
      [
        {
          text: "👥 My Referrals",
          callback_data: "refs"
        },
        {
          text: "💰 Balance",
          callback_data: "balance"
        }
      ],
      [
        {
          text: "🏆 Leaderboard",
          callback_data: "top"
        }
      ],
      [
        {
          text: "📢 Join Channel",
          url: "https://t.me/gangs234"
        }
      ]
    ]
  }
});
});

/* ================= CALLBACK QUERY ================= */

bot.on("callback_query", async (query) => {
  const chatId = String(query.message.chat.id);
  const user = await User.findOne({ userId: chatId });

  if (query.data === "start_bot") {
    bot.sendMessage(chatId, "🚀 Bot started!");
  }

  if (query.data === "refs") {
    const link = getRefLink(chatId);

    bot.sendMessage(chatId,
`👥 *YOUR REFERRALS*

📊 Referrals: *${user?.refs || 0}*
💰 Balance: *${user?.balance || 0} coins*

🔗 Link:
${link}`,
{ parse_mode: "Markdown" });
  }

  if (query.data === "balance") {
    bot.sendMessage(chatId,
`💰 *BALANCE*

🪙 ${user?.balance || 0} coins`,
{ parse_mode: "Markdown" });
  }

  if (query.data === "top") {
    const top = await User.find().sort({ balance: -1 }).limit(10);

    let text = "🏆 *TOP USERS*\n\n";

    top.forEach((u, i) => {
      text += `${i + 1}. ${u.userId}\n💰 ${u.balance} coins\n\n`;
    });

    bot.sendMessage(chatId, text, { parse_mode: "Markdown" });
  }

  bot.answerCallbackQuery(query.id).catch(() => {});
});

/* ================= /REF ================= */

bot.onText(/\/ref/, async (msg) => {
  const chatId = String(msg.chat.id);

  let user = await User.findOne({ userId: chatId });

  if (!user) {
    user = await User.create({ userId: chatId });
  }

  const link = getRefLink(chatId);

  bot.sendMessage(chatId,
`👥 *YOUR REFERRAL INFO*

📊 Referrals: *${user.refs}*
💰 Balance: *${user.balance} coins*

🔗 Link:
${link}`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🔗 Share Referral",
          url: `https://t.me/share/url?url=${encodeURIComponent(link)}`
        }
      ]
    ]
  }
});
});

/* ================= /BALANCE ================= */

bot.onText(/\/balance/, async (msg) => {
  const user = await User.findOne({ userId: String(msg.chat.id) });

  bot.sendMessage(msg.chat.id,
`💰 *BALANCE*

🪙 ${user?.balance || 0} coins`,
{ parse_mode: "Markdown" });
});

/* ================= /TOP ================= */

bot.onText(/\/top/, async (msg) => {
  const top = await User.find().sort({ balance: -1 }).limit(10);

  let text = "🏆 *TOP USERS*\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. ${u.userId}\n💰 ${u.balance} coins\n\n`;
  });

  bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
});

/* ================= SERVER ================= */

app.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});
