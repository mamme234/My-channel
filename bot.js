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

const WEB_APP_URL =
  "https://myapp1-khaki.vercel.app/";

const CHANNEL = "@gangs234";

const GROUP_ID = "-1003984859530";

const VOTE_LINK =
  "https://oiaward.com/nominees?category=13";

/* ================= INIT ================= */

const bot = new TelegramBot(
  BOT_TOKEN,
  {
    polling: true
  }
);

const app = express();

app.use(express.json());

/* ================= DATABASE ================= */

mongoose.connect(MONGO_URI)
.then(() => {

  console.log("✅ MongoDB Connected");

})
.catch((err) => {

  console.log("❌ MongoDB Error");
  console.log(err);

});

/* ================= USER MODEL ================= */

const User = mongoose.model("User", {

  userId: String,

  balance: {
    type: Number,
    default: 0
  },

  refs: {
    type: Number,
    default: 0
  },

  referredBy: {
    type: String,
    default: null
  },

  lastBonus: {
    type: Number,
    default: 0
  },

  lastReward: {
    type: Number,
    default: 0
  }

});

/* ================= VIDEO ================= */

let VOTE_VIDEO_ID =
"BAACAgQAAxkBAAIDIWoFvgy3nxAurhzCAAGQeSkarazfYwACPh0AAlZPKFDGVoT6CEN3QDsE";

/* ================= SERVER ================= */

app.get("/", (req, res) => {

  res.send("🚀 Bot Running");

});

/* ================= FORCE JOIN ================= */

async function checkJoin(userId) {

  try {

    const member =
      await bot.getChatMember(
        CHANNEL,
        userId
      );

    return (
      member.status === "member" ||
      member.status === "administrator" ||
      member.status === "creator"
    );

  } catch {

    return false;

  }

}

/* ================= REF LINK ================= */

function getRefLink(id) {

  return `https://t.me/${BOT_USERNAME}?start=ref_${id}`;

}

/* ================= POST SYSTEM ================= */

async function postToAll(text) {

  const keyboard = {

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

    await bot.sendMessage(
      CHANNEL,
      text,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );

    await bot.sendMessage(
      GROUP_ID,
      text,
      {
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );

  } catch (err) {

    console.log(
      "❌ Post Error:",
      err.message
    );

  }

}

/* ================= START ================= */

bot.onText(
/\/start(?: (.+))?/,
async (msg, match) => {

  const id =
    String(msg.chat.id);

  const param =
    match?.[1];

  /* ===== FORCE JOIN ===== */

  const joined =
    await checkJoin(id);

  if (!joined) {

    return bot.sendMessage(
      id,
`📢 Join our channel first.`,
{
  reply_markup: {

    inline_keyboard: [

      [
        {
          text: "📢 Join Channel",
          url: "https://t.me/gangs234"
        }
      ],

      [
        {
          text: "✅ Check Join",
          callback_data: "check_join"
        }
      ]

    ]

  }

});

  }

  let user =
    await User.findOne({
      userId: id
    });

  if (!user) {

    user =
      await User.create({
        userId: id
      });

  }

  /* ===== REFERRAL ===== */

  if (
    param &&
    param.startsWith("ref_")
  ) {

    const refId =
      param.replace("ref_", "");

    if (
      refId !== id &&
      !user.referredBy
    ) {

      const refUser =
        await User.findOne({
          userId: refId
        });

      if (refUser) {

        user.referredBy =
          refId;

        refUser.refs += 1;

        refUser.balance += 10;

        await user.save();

        await refUser.save();

        bot.sendMessage(
          refId,
          "🎉 New referral joined! +10 coins"
        );

      }

    }

  }

  /* ===== MAIN UI ===== */

  bot.sendMessage(
    id,
`🔥 *WELCOME TO STUDYBUDDY*

💰 Balance: *${user.balance}*
👥 Referrals: *${user.refs}*

Choose option below 👇`,
{
  parse_mode: "Markdown",

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
        },

        {
          text: "👥 Referrals",
          callback_data: "refs"
        }
      ],

      [
        {
          text: "🎁 Daily Bonus",
          callback_data: "bonus"
        },

        {
          text: "🏆 Top Users",
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

/* ================= CALLBACKS ================= */

bot.on(
"callback_query",
async (query) => {

  const id =
    String(query.message.chat.id);

  const user =
    await User.findOne({
      userId: id
    });

  if (!user) return;

  /* ===== CHECK JOIN ===== */

  if (
    query.data === "check_join"
  ) {

    const joined =
      await checkJoin(id);

    if (!joined) {

      return bot.answerCallbackQuery(
        query.id,
        {
          text: "❌ You still haven't joined",
          show_alert: true
        }
      );

    }

    bot.answerCallbackQuery(
      query.id,
      {
        text: "✅ Joined successfully"
      }
    );

    return bot.sendMessage(
      id,
      "🚀 Send /start"
    );

  }

  /* ===== BALANCE ===== */

  if (
    query.data === "balance"
  ) {

    return bot.sendMessage(
      id,
`💰 *YOUR BALANCE*

🪙 ${user.balance} coins`,
{
  parse_mode: "Markdown"
});

  }

  /* ===== REFS ===== */

  if (
    query.data === "refs"
  ) {

    return bot.sendMessage(
      id,
`👥 *YOUR REFERRALS*

👥 Referrals:
${user.refs}

🔗 Link:

${getRefLink(id)}`,
{
  parse_mode: "Markdown"
});

  }

  /* ===== BONUS ===== */

  if (
    query.data === "bonus"
  ) {

    const now =
      Date.now();

    if (
      now - user.lastBonus <
      86400000
    ) {

      return bot.sendMessage(
        id,
        "⏳ Bonus already claimed today"
      );

    }

    user.balance += 50;

    user.lastBonus = now;

    await user.save();

    return bot.sendMessage(
      id,
      "🎁 +50 bonus added"
    );

  }

  /* ===== TOP ===== */

  if (
    query.data === "top"
  ) {

    const top =
      await User.find()
      .sort({
        balance: -1
      })
      .limit(10);

    let text =
`🏆 *TOP USERS*

`;

    top.forEach((u, i) => {

      text +=
`${i + 1}. ${u.userId}
💰 ${u.balance}

`;

    });

    return bot.sendMessage(
      id,
      text,
      {
        parse_mode: "Markdown"
      }
    );

  }

  bot.answerCallbackQuery(
    query.id
  ).catch(() => {});

});

/* ================= /BALANCE ================= */

bot.onText(
/^\/balance$/,
async (msg) => {

  const id =
    String(msg.chat.id);

  let user =
    await User.findOne({
      userId: id
    });

  if (!user) {

    user =
      await User.create({
        userId: id
      });

  }

  bot.sendMessage(
    id,
`💰 *YOUR BALANCE*

🪙 ${user.balance} coins`,
{
  parse_mode: "Markdown"
});

});

/* ================= /REF ================= */

bot.onText(
/^\/ref$/,
async (msg) => {

  const id =
    String(msg.chat.id);

  let user =
    await User.findOne({
      userId: id
    });

  if (!user) {

    user =
      await User.create({
        userId: id
      });

  }

  const link =
    getRefLink(id);

  bot.sendMessage(
    id,
`👥 *REFERRAL SYSTEM*

👥 Total Referrals:
${user.refs}

💰 Balance:
${user.balance}

🔗 Your Referral Link:

${link}`,
{
  parse_mode: "Markdown"
});

});

/* ================= /REWARD ================= */

bot.onText(
/\/reward/,
async (msg) => {

  const id =
    String(msg.chat.id);

  const user =
    await User.findOne({
      userId: id
    });

  if (!user) return;

  const now =
    Date.now();

  if (
    now - user.lastReward <
    30000
  ) {

    return bot.sendMessage(
      id,
      "⏳ Wait 30 seconds"
    );

  }

  user.balance += 5;

  user.lastReward = now;

  await user.save();

  bot.sendMessage(
    id,
    "💰 +5 coins added"
  );

});

/* ================= /WITHDRAW ================= */

bot.onText(
/\/withdraw (.+)/,
async (msg, match) => {

  const id =
    String(msg.chat.id);

  const amount =
    Number(match[1]);

  const user =
    await User.findOne({
      userId: id
    });

  if (!user) return;

  if (amount < 100) {

    return bot.sendMessage(
      id,
      "❌ Minimum withdraw is 100"
    );

  }

  if (
    user.balance < amount
  ) {

    return bot.sendMessage(
      id,
      "❌ Not enough balance"
    );

  }

  user.balance -= amount;

  await user.save();

  bot.sendMessage(
    ADMIN_ID,
`💸 *WITHDRAW REQUEST*

👤 User:
${id}

💰 Amount:
${amount}`,
{
  parse_mode: "Markdown"
});

  bot.sendMessage(
    id,
    "✅ Withdraw request sent"
  );

});

/* ================= /POST ================= */

bot.onText(
/\/post (.+)/,
async (msg, match) => {

  if (
    String(msg.chat.id) !== ADMIN_ID
  ) return;

  await postToAll(
`📢 *UPDATE*

${match[1]}`
  );

  bot.sendMessage(
    ADMIN_ID,
    "✅ Posted"
  );

});

/* ================= /POSTTOP ================= */

bot.onText(
/\/posttop/,
async (msg) => {

  if (
    String(msg.chat.id) !== ADMIN_ID
  ) return;

  const top =
    await User.find()
    .sort({
      balance: -1
    })
    .limit(10);

  let text =
`🏆 *TOP USERS*

`;

  top.forEach((u, i) => {

    text +=
`${i + 1}. ${u.userId}
💰 ${u.balance}

`;

  });

  await postToAll(text);

  bot.sendMessage(
    ADMIN_ID,
    "✅ Leaderboard posted"
  );

});

/* ================= /MOTIVATE ================= */

bot.onText(
/\/motivate/,
async (msg) => {

  if (
    String(msg.chat.id) !== ADMIN_ID
  ) return;

  await postToAll(
`🚀 *KEEP GOING!*

💰 Watch ads
👥 Invite friends
🏆 Reach leaderboard
🎁 Earn rewards daily`
  );

  bot.sendMessage(
    ADMIN_ID,
    "✅ Motivation posted"
  );

});

/* ================= /UPDATE ================= */

bot.onText(
/\/update/,
async (msg) => {

  if (
    String(msg.chat.id) !== ADMIN_ID
  ) return;

  await postToAll(
`📢 *IMPORTANT UPDATE*

⚠️ The owner changed the system.

💰 New ads-based earning system is now active.

• Watch ads
• Earn rewards
• More updates coming soon

🚀 Stay tuned`
  );

  bot.sendMessage(
    ADMIN_ID,
    "✅ Update posted"
  );

});

/* ================= /VOTE ================= */

bot.onText(
/\/vote/,
async (msg) => {

  if (
    String(msg.chat.id) !== ADMIN_ID
  ) return;

  const caption =
`🎤 *VOTE FOR @raja_music0*

🏆 OI Award voting is open`;

  const keyboard = {

    inline_keyboard: [
      [
        {
          text: "🗳 Vote Now",
          url: VOTE_LINK
        }
      ]
    ]

  };

  try {

    await bot.sendVideo(
      CHANNEL,
      VOTE_VIDEO_ID,
      {
        caption,
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );

    await bot.sendVideo(
      GROUP_ID,
      VOTE_VIDEO_ID,
      {
        caption,
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );

    bot.sendMessage(
      ADMIN_ID,
      "✅ Vote posted"
    );

  } catch (err) {

    console.log(err);

    bot.sendMessage(
      ADMIN_ID,
      "❌ Vote failed"
    );

  }

});

/* ================= ERRORS ================= */

process.on(
"uncaughtException",
(err) => {

  console.log(
    "❌ ERROR:",
    err
  );

});

process.on(
"unhandledRejection",
(err) => {

  console.log(
    "❌ PROMISE ERROR:",
    err
  );

});

/* ================= START SERVER ================= */

app.listen(PORT, () => {

  console.log(
    `🚀 Server running on ${PORT}`
  );

});
