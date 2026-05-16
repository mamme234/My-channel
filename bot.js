require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");
const fs = require("fs");

/* ================= CONFIG ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;

const PORT = process.env.PORT || 3000;

const ADMIN_ID = 7154361039;

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

  console.log(
    "✅ MongoDB Connected"
  );

})
.catch((err) => {

  console.log(
    "❌ MongoDB Error"
  );

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
  }

});

/* ================= SERVER ================= */

app.get("/", (req, res) => {

  res.send(
    "🚀 Bot Running"
  );

});

/* ================= REF LINK ================= */

function getRefLink(id) {

  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;

}

/* ================= NORMAL POST SYSTEM ================= */

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

  /* ================= REFERRAL ================= */

  if (
    param &&
    param.startsWith("ref")
  ) {

    const refId =
      param.replace("ref", "");

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

  /* ================= PRIVATE BOT UI ================= */

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

  /* ================= BALANCE ================= */

  if (
    query.data === "balance"
  ) {

    bot.sendMessage(
      id,
`💰 *YOUR BALANCE*

🪙 ${user.balance} coins`,
{
  parse_mode: "Markdown"
});

  }

  /* ================= REF ================= */

  if (
    query.data === "refs"
  ) {

    const link =
      getRefLink(id);

    bot.sendMessage(
      id,
`👥 *YOUR REFERRALS*

👥 Total Referrals:
${user.refs}

🔗 Your Link:
${link}`,
{
  parse_mode: "Markdown"
});

  }

  /* ================= TOP ================= */

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
💰 ${u.balance} coins

`;

    });

    bot.sendMessage(
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

/* ================= /REF ================= */

bot.onText(
/\/ref/,
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

👥 Referrals:
${user.refs}

💰 Balance:
${user.balance}

🔗 Your Link:
${link}`,
{
  parse_mode: "Markdown"
});

});

/* ================= /POST ================= */

bot.onText(
/\/post (.+)/,
async (msg, match) => {

  if (
    msg.chat.id != ADMIN_ID
  ) return;

  const text =
    match[1];

  await postToAll(
`📢 *UPDATE*

${text}`
  );

  bot.sendMessage(
    ADMIN_ID,
    "✅ Posted successfully"
  );

});

/* ================= /POSTTOP ================= */

bot.onText(
/\/posttop/,
async (msg) => {

  if (
    msg.chat.id != ADMIN_ID
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
💰 ${u.balance} coins

`;

  });

  await postToAll(text);

  bot.sendMessage(
    ADMIN_ID,
    "✅ Leaderboard posted"
  );

});

/* ================= /ACTIVE ================= */

bot.onText(
/\/active/,
async (msg) => {

  if (
    msg.chat.id != ADMIN_ID
  ) return;

  const total =
    await User.countDocuments();

  const text =
`🔥 *ACTIVE REPORT*

👥 Total Users:
${total}

🚀 System running strong`;

  await postToAll(text);

  bot.sendMessage(
    ADMIN_ID,
    "✅ Activity posted"
  );

});

/* ================= /MOTIVATE ================= */

bot.onText(
/\/motivate/,
async (msg) => {

  if (
    msg.chat.id != ADMIN_ID
  ) return;

  const text =
`🚀 *KEEP GOING!*

💰 Invite friends
🏆 Reach leaderboard
🎁 Earn rewards daily`;

  await postToAll(text);

  bot.sendMessage(
    ADMIN_ID,
    "✅ Motivation posted"
  );

});

/* ================= /VOTE VIDEO POST ================= */

bot.onText(
/\/vote/,
async (msg) => {

  if (
    msg.chat.id != ADMIN_ID
  ) return;

  const caption =
`🎤 *VOTE FOR @raja_music0*

🏆 OI Award voting is now open!

❤️ Support *Raja Music* by voting now.

👇 Tap the button below to vote.`;

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

    /* ===== CHANNEL ===== */

    await bot.sendVideo(
      CHANNEL,
      fs.createReadStream("./vote.mp4"),
      {
        caption: caption,
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );

    /* ===== GROUP ===== */

    await bot.sendVideo(
      GROUP_ID,
      fs.createReadStream("./vote.mp4"),
      {
        caption: caption,
        parse_mode: "Markdown",
        reply_markup: keyboard
      }
    );

    bot.sendMessage(
      ADMIN_ID,
      "✅ Vote video posted"
    );

  } catch (err) {

    console.log(err);

    bot.sendMessage(
      ADMIN_ID,
      "❌ Failed to post vote video"
    );

  }

});

/* ================= SERVER START ================= */

app.listen(PORT, () => {

  console.log(
    `🚀 Server running on ${PORT}`
  );

});
