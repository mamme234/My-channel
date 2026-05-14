require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

/* ================= CONFIG ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

const ADMIN_ID = "7154361039";
const BOT_USERNAME = "Studybuddy_2025Bot";

const CHANNEL = "@gangs234";
const GROUP_ID = "-1003984859530";

const WEB_APP_URL = "https://myapp1-khaki.vercel.app/";
const VOTE_LINK = "https://oiaward.com/nominees?category=13";

/* ⚠️ IMPORTANT: ONLY ONE VIDEO_ID (FIXED CRASH) */

const VIDEO_ID = "BAACAgQAAxkBAAIDIWoFvgy3nxAurhzCAAGQeSkarazfYwACPh0AAlZPKFDGVoT6CEN3QDsE";

/* ================= INIT ================= */

const bot = new TelegramBot(BOT_TOKEN, {
  polling: true
});

const app = express();
app.use(express.json());

/* ================= DB ================= */

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Error", err));

const User = mongoose.model("User", {
  userId: String,
  balance: { type: Number, default: 0 },
  refs: { type: Number, default: 0 },
  referredBy: { type: String, default: null }
});

/* ================= HELPERS ================= */

function getRefLink(id) {
  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;
}

async function postToAll(text) {
  const keyboard = {
    inline_keyboard: [
      [{ text: "🚀 Start Bot", url: `https://t.me/${BOT_USERNAME}` }]
    ]
  };

  try {
    await bot.sendMessage(CHANNEL, text, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });

    await bot.sendMessage(GROUP_ID, text, {
      parse_mode: "Markdown",
      reply_markup: keyboard
    });

  } catch (err) {
    console.log("POST ERROR:", err.message);
  }
}

/* ================= FILE ID DEBUG (OPTIONAL) ================= */

bot.on("video", (msg) => {
  const fileId = msg.video.file_id;

  console.log("🎥 FILE ID:", fileId);

  bot.sendMessage(msg.chat.id,
`🎥 FILE ID:

${fileId}`);
});

/* ================= START ================= */

bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
  const id = String(msg.chat.id);
  const param = match?.[1];

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  /* referral */
  if (param && param.startsWith("ref")) {
    const refId = param.replace("ref", "");

    if (refId !== id && !user.referredBy) {
      const refUser = await User.findOne({ userId: refId });

      if (refUser) {
        user.referredBy = refId;
        refUser.refs += 1;
        refUser.balance += 10;

        await user.save();
        await refUser.save();

        bot.sendMessage(refId, "🎉 New referral +10 coins");
      }
    }
  }

  bot.sendMessage(id,
`🔥 WELCOME

💰 Balance: ${user.balance}
👥 Referrals: ${user.refs}`, {
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Start App", web_app: { url: WEB_APP_URL } }],
        [
          { text: "💰 Balance", callback_data: "balance" },
          { text: "👥 Referrals", callback_data: "refs" }
        ],
        [{ text: "🏆 Top Users", callback_data: "top" }],
        [{ text: "📢 Join Channel", url: "https://t.me/gangs234" }]
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
    return bot.sendMessage(id,
`👥 Referrals: ${user.refs}
🔗 ${getRefLink(id)}`);
  }

  if (q.data === "top") {
    const top = await User.find().sort({ balance: -1 }).limit(10);

    let text = "🏆 TOP USERS\n\n";
    top.forEach((u, i) => {
      text += `${i + 1}. ${u.userId} - ${u.balance}\n`;
    });

    return bot.sendMessage(id, text);
  }

  bot.answerCallbackQuery(q.id).catch(() => {});
});

/* ================= REF ================= */

bot.onText(/\/ref/, async (msg) => {
  const id = String(msg.chat.id);

  let user = await User.findOne({ userId: id });
  if (!user) user = await User.create({ userId: id });

  bot.sendMessage(id,
`👥 Referrals: ${user.refs}
💰 Balance: ${user.balance}
🔗 ${getRefLink(id)}`);
});

/* ================= ADMIN COMMANDS ================= */

bot.onText(/\/post (.+)/, async (msg, match) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  await postToAll(`📢 UPDATE\n\n${match[1]}`);
  bot.sendMessage(ADMIN_ID, "✅ Posted");
});

bot.onText(/\/motivate/, async (msg) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  await postToAll(`🚀 KEEP GOING!\nInvite friends & earn rewards`);
  bot.sendMessage(ADMIN_ID, "✅ Motivated");
});

bot.onText(/\/posttop/, async (msg) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  const top = await User.find().sort({ balance: -1 }).limit(10);

  let text = "🏆 TOP USERS\n\n";
  top.forEach((u, i) => {
    text += `${i + 1}. ${u.userId} - ${u.balance}\n`;
  });

  await postToAll(text);
  bot.sendMessage(ADMIN_ID, "✅ Leaderboard posted");
});

bot.onText(/\/active/, async (msg) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  const total = await User.countDocuments();

  await postToAll(`🔥 ACTIVE USERS\n\n${total}`);
  bot.sendMessage(ADMIN_ID, "✅ Active posted");
});

/* ================= VOTE (FIXED) ================= */

bot.onText(/\/vote/, async (msg) => {
  if (String(msg.chat.id) !== ADMIN_ID) return;

  const caption =
`🎤 VOTE FOR @raja_music0

🏆 OI Award voting is open`;

  const keyboard = {
    inline_keyboard: [
      [{ text: "🗳 Vote Now", url: VOTE_LINK }]
    ]
  };

  try {
    await bot.sendVideo(CHANNEL, VIDEO_ID, {
      caption,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });

    await bot.sendVideo(GROUP_ID, VIDEO_ID, {
      caption,
      parse_mode: "Markdown",
      reply_markup: keyboard
    });

    bot.sendMessage(ADMIN_ID, "✅ Video posted");
  } catch (err) {
    console.log("ERROR:", err);
    bot.sendMessage(ADMIN_ID, "❌ " + err.message);
  }
});

/* ================= SERVER ================= */

app.get("/", (req, res) => {
  res.send("🚀 Bot Running");
});

app.listen(PORT, () => {
  console.log("🚀 Server running on " + PORT);
});
