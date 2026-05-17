require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");
const cron = require("node-cron");

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

/* ================= VIDEO ID ================= */

let VOTE_VIDEO_ID = null;

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

  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;

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

/* ================= SAVE VIDEO ID ================= */

bot.on("message", async (msg) => {

  if (
    String(msg.chat.id) !== ADMIN_ID
  ) return;

  if (msg.video) {

    VOTE_VIDEO_ID =
      msg.video.file_id;

    bot.sendMessage(
      ADMIN_ID,
`✅ Video Saved

🆔 Video ID:

\`${VOTE_VIDEO_ID}\``,
{
  parse_mode: "Markdown"
});

  }

});

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
`📢 Join our channel first to use the bot.`,
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

  /* ================= UI ================= */

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
          text: "🎁 Daily Bonus",
          callback_data: "bonus"
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
      "🚀 Now send /start"
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

    const link =
      getRefLink(id);

    return bot.sendMessage(
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
        "⏳ You already claimed today's bonus"
      );

    }

    user.balance += 50;

    user.lastBonus = now;

    await user.save();

    return bot.sendMessage(
      id,
      "🎁 Daily bonus claimed: +50 coins"
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
💰 ${u.balance} coins

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

  const now =
    Date.now();

  if (
    now - user.lastReward <
    30000
  ) {

    return bot.sendMessage(
      id,
      "⏳ Wait 30 seconds before next reward"
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
`💸 *NEW WITHDRAW REQUEST*

👤 User:
${id}

💰 Amount:
${amount}`,
{
  parse_mode: "Markdown"
});

  bot.sendMessage(
    id,
    "✅ Withdraw request submitted"
  );

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
    String(msg.chat.id) !==
    ADMIN_ID
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
    String(msg.chat.id) !==
    ADMIN_ID
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
    String(msg.chat.id) !==
    ADMIN_ID
  ) return;

  const total =
    await User.countDocuments();

  await postToAll(
`🔥 *ACTIVE REPORT*

👥 Total Users:
${total}

🚀 System running strong`
  );

  bot.sendMessage(
    ADMIN_ID,
    "✅ Activity posted"
  );

});

/* ================= /UPDATE ================= */

bot.onText(
/\/update/,
async (msg) => {

  if (
    String(msg.chat.id) !==
    ADMIN_ID
  ) return;

  const text =
`📢 *IMPORTANT UPDATE*

⚠️ The owner changed the system.

We are now running a new and improved version of the platform.

💰 New system:
Ads-based earning

• Watch ads
• Earn rewards
• More features coming soon

🚀 Stay tuned for updates!`;

  await postToAll(text);

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
    String(msg.chat.id) !==
    ADMIN_ID
  ) return;

  if (!VOTE_VIDEO_ID) {

    return bot.sendMessage(
      ADMIN_ID,
      "❌ Send a video first"
    );

  }

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
      "❌ Failed to post vote video"
    );

  }

});

/* ================= AUTO LEADERBOARD ================= */

cron.schedule(
"0 */6 * * *",
async () => {

  const top =
    await User.find()
    .sort({
      balance: -1
    })
    .limit(10);

  let text =
`🏆 *AUTO LEADERBOARD*

`;

  top.forEach((u, i) => {

    text +=
`${i + 1}. ${u.userId}
💰 ${u.balance}

`;

  });

  await postToAll(text);

});

/* ================= ERROR HANDLER ================= */

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

/* ================= SERVER START ================= */

app.listen(PORT, () => {

  console.log(
    `🚀 Server running on ${PORT}`
  );

});
