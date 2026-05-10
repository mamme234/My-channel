require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const mongoose = require("mongoose");

/* ================= CONFIG ================= */

const BOT_TOKEN = process.env.BOT_TOKEN;
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3000;

const BOT_USERNAME = "Studybuddy_2025Bot";

const CHANNEL = "@gangs234";
const GROUP_ID = "-1003984859530";

const ADMIN_ID = 7154361039;

const MINI_APP =
  "https://myapp1-khaki.vercel.app/";

/* ================= CHECK ================= */

console.log(
  "BOT:",
  BOT_TOKEN ? "OK" : "MISSING"
);

console.log(
  "MONGO:",
  MONGO_URI ? "OK" : "MISSING"
);

if (!BOT_TOKEN || !MONGO_URI) {

  console.log(
    "❌ Missing env variables"
  );

  process.exit(1);
}

/* ================= DATABASE ================= */

mongoose.connect(MONGO_URI)
.then(() => {

  console.log(
    "✅ MongoDB Connected"
  );

})
.catch((err) => {

  console.log(
    "❌ Mongo Error"
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
  },

  joinTime: {
    type: Number,
    default: Date.now
  }

});

/* ================= EXPRESS ================= */

const app = express();

app.use(express.json());

app.get("/", (req, res) => {

  res.send(
    "🚀 StudyBuddy Bot Running"
  );

});

/* ================= BOT ================= */

const bot = new TelegramBot(
  BOT_TOKEN,
  {
    polling: true
  }
);

bot.deleteWebHook()
.catch(() => {});

/* ================= HELPERS ================= */

function getRefLink(id) {

  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;

}

/* ================= CHANNEL CHECK ================= */

async function checkJoin(id) {

  try {

    const member =
      await bot.getChatMember(
        CHANNEL,
        id
      );

    return [
      "member",
      "administrator",
      "creator"
    ].includes(member.status);

  } catch {

    return false;

  }
}

/* ================= START ================= */

bot.onText(
/\/start(?: (.+))?/,
async (msg, match) => {

  const chatId =
    String(msg.chat.id);

  const param =
    match?.[1];

  const joined =
    await checkJoin(chatId);

  if (!joined) {

    return bot.sendMessage(
      chatId,
      "⚠️ Join channel first",
      {
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
      }
    );
  }

  let user =
    await User.findOne({
      userId: chatId
    });

  if (!user) {

    user =
      await User.create({
        userId: chatId
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
      refId !== chatId &&
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
          "🎉 You earned +10 coins from referral!"
        );

      }
    }
  }

  const link =
    getRefLink(chatId);

  bot.sendMessage(
    chatId,
`🔥 *WELCOME TO STUDYBUDDY* 🔥

💰 Balance: *${user.balance} coins*
👥 Referrals: *${user.refs}*

🔗 *Your Referral Link:*
${link}

🚀 Press the button below to start earning!`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [

      [
        {
          text: "🚀 Start App",
          web_app: {
            url: MINI_APP
          }
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

/* ================= CALLBACKS ================= */

bot.on(
"callback_query",
async (query) => {

  const chatId =
    String(
      query.message.chat.id
    );

  const user =
    await User.findOne({
      userId: chatId
    });

  /* ================= REFERRALS ================= */

  if (
    query.data === "refs"
  ) {

    const link =
      getRefLink(chatId);

    bot.sendMessage(
      chatId,
`👥 *YOUR REFERRALS*

📊 Referrals: *${user?.refs || 0}*

💰 Balance: *${user?.balance || 0} coins*

🔗 *Referral Link:*
${link}`,
{
  parse_mode: "Markdown"
});

  }

  /* ================= BALANCE ================= */

  if (
    query.data === "balance"
  ) {

    bot.sendMessage(
      chatId,
`💰 *YOUR BALANCE*

🪙 ${user?.balance || 0} coins`,
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
      chatId,
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

  const chatId =
    String(msg.chat.id);

  let user =
    await User.findOne({
      userId: chatId
    });

  if (!user) {

    user =
      await User.create({
        userId: chatId
      });

  }

  const link =
    getRefLink(chatId);

  bot.sendMessage(
    chatId,
`👥 *YOUR REFERRAL INFO*

📊 Referrals: *${user.refs}*

💰 Balance: *${user.balance} coins*

🔗 *Your Referral Link:*
${link}`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🔗 Share Referral",
          url:
`https://t.me/share/url?url=${encodeURIComponent(link)}`
        }
      ]
    ]
  }
});

});

/* ================= /BALANCE ================= */

bot.onText(
/\/balance/,
async (msg) => {

  const user =
    await User.findOne({
      userId:
        String(msg.chat.id)
    });

  bot.sendMessage(
    msg.chat.id,
`💰 *BALANCE*

🪙 ${user?.balance || 0} coins`,
{
  parse_mode: "Markdown"
});

});

/* ================= /TOP ================= */

bot.onText(
/\/top/,
async (msg) => {

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
    msg.chat.id,
    text,
    {
      parse_mode: "Markdown"
    }
  );

});

/* ================= /POST ================= */

bot.onText(
/\/post (.+)/,
async (msg, match) => {

  if (
    msg.chat.id !== ADMIN_ID
  ) return;

  const text =
    match[1];

  const options = {

    parse_mode: "Markdown",

    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🤖 Start Bot",
            url: `https://t.me/${BOT_USERNAME}`
          }
        ]
      ]
    }

  };

  bot.sendMessage(
    CHANNEL,
`📢 *UPDATE*

${text}`,
    options
  ).catch(console.log);

  bot.sendMessage(
    GROUP_ID,
`📢 *UPDATE*

${text}`,
    options
  ).catch(console.log);

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
    msg.chat.id !== ADMIN_ID
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

  bot.sendMessage(
    CHANNEL,
    text,
    {
      parse_mode: "Markdown"
    }
  );

  bot.sendMessage(
    GROUP_ID,
    text,
    {
      parse_mode: "Markdown"
    }
  );

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
    msg.chat.id !== ADMIN_ID
  ) return;

  const total =
    await User.countDocuments();

  const text =
`🔥 *DAILY ACTIVITY*

👥 Total Users: *${total}*

🚀 Users are earning daily rewards!

💰 Invite friends and climb leaderboard!`;

  bot.sendMessage(
    CHANNEL,
    text,
    {
      parse_mode: "Markdown"
    }
  );

  bot.sendMessage(
    GROUP_ID,
    text,
    {
      parse_mode: "Markdown"
    }
  );

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
    msg.chat.id !== ADMIN_ID
  ) return;

  const text =
`🚀 *KEEP EARNING!*

💰 Invite more friends
🏆 Reach leaderboard
🎁 Earn daily rewards

🔥 Stay active and earn more coins!`;

  bot.sendMessage(
    CHANNEL,
    text,
    {
      parse_mode: "Markdown"
    }
  );

  bot.sendMessage(
    GROUP_ID,
    text,
    {
      parse_mode: "Markdown"
    }
  );

  bot.sendMessage(
    ADMIN_ID,
    "✅ Motivation posted"
  );

});

/* ================= /WITHDRAW ================= */

bot.onText(
/\/withdraw (.+)/,
async (msg, match) => {

  const chatId =
    String(msg.chat.id);

  const amount =
    Number(match[1]);

  const user =
    await User.findOne({
      userId: chatId
    });

  if (
    !user ||
    user.balance < amount
  ) {

    return bot.sendMessage(
      chatId,
      "❌ Not enough balance"
    );

  }

  user.balance -= amount;

  await user.save();

  bot.sendMessage(
    ADMIN_ID,
`💸 *WITHDRAW REQUEST*

👤 User: ${chatId}

💰 Amount: ${amount} coins`,
{
  parse_mode: "Markdown"
});

  bot.sendMessage(
    chatId,
    "⏳ Withdraw request sent"
  );

});

/* ================= API ================= */

app.get(
"/user/:id",
async (req, res) => {

  const user =
    await User.findOne({
      userId:
        req.params.id
    });

  if (!user) {

    return res.json({
      ok: false
    });

  }

  res.json({

    ok: true,

    balance:
      user.balance,

    refs:
      user.refs

  });

});

/* ================= SERVER ================= */

app.listen(PORT, () => {

  console.log(
    `🚀 Server running on ${PORT}`
  );

});
