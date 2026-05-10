const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

/* =========================
   BOT TOKEN
========================= */
const token = process.env.BOT_TOKEN;

if (!token) {
  console.log("❌ BOT_TOKEN missing");
  process.exit(1);
}

/* =========================
   BOT START
========================= */
const bot = new TelegramBot(token);

bot.deleteWebHook()
.then(() => {
  bot.startPolling();
  console.log("✅ Bot polling started");
})
.catch(console.log);

/* =========================
   INFO
========================= */
const BOT_USERNAME = "Studybuddy_2025Bot";

const CHANNEL = "@gangs234";
const GROUP_ID = "-1003984859530";

const ADMIN_ID = 7154361039;

const MINI_APP =
  "https://myapp1-khaki.vercel.app/";

/* =========================
   USERS DATABASE
========================= */
const USERS_FILE = "users.json";

let users = {};

/*
Structure:
{
  "12345": {
    refs: 0,
    balance: 0,
    referredBy: null
  }
}
*/

// load users safely
try {
  users = JSON.parse(
    fs.readFileSync(USERS_FILE, "utf8")
  );
} catch (e) {
  users = {};
}

// save users
function saveUsers() {
  fs.writeFileSync(
    USERS_FILE,
    JSON.stringify(users, null, 2)
  );
}

/* =========================
   REFERRAL LINK
========================= */
function getReferralLink(userId) {
  return `https://t.me/${BOT_USERNAME}?start=ref${userId}`;
}

/* =========================
   SEND EVERYWHERE
========================= */
function sendEverywhere(text) {

  const options = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Open App",
            url: MINI_APP
          }
        ]
      ]
    }
  };

  // send to channel
  bot.sendMessage(
    CHANNEL,
    text,
    options
  ).catch(console.log);

  // send to group
  bot.sendMessage(
    GROUP_ID,
    text,
    options
  ).catch(console.log);
}

/* =========================
   START + REFERRAL SYSTEM
========================= */
bot.onText(/\/start(?: (.+))?/, (msg, match) => {

  const chatId = msg.chat.id;
  const param = match?.[1];

  // create user
  if (!users[chatId]) {
    users[chatId] = {
      refs: 0,
      balance: 0,
      referredBy: null
    };
  }

  // referral logic
  if (
    param &&
    param.startsWith("ref")
  ) {

    const refId =
      param.replace("ref", "");

    if (
      refId !== String(chatId) &&
      users[chatId].referredBy === null &&
      users[refId]
    ) {

      users[chatId].referredBy =
        refId;

      users[refId].refs += 1;

      users[refId].balance += 10;

      saveUsers();

      bot.sendMessage(
        refId,
        "🎉 You earned +10 coins from referral!"
      ).catch(() => {});
    }
  }

  saveUsers();

  const refLink =
    getReferralLink(chatId);

  bot.sendMessage(
    chatId,
`🔥 *WELCOME TO STUDYBUDDY* 🔥

💰 Balance: *${users[chatId].balance} coins*
👥 Referrals: *${users[chatId].refs}*

🔗 *Your referral link:*
${refLink}

🚀 Invite friends and earn more coins!`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🚀 Start Earning",
          web_app: {
            url: MINI_APP
          }
        }
      ],
      [
        {
          text: "👥 My Referrals",
          callback_data: "refs"
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
          text: "📢 Join Channel",
          url: "https://t.me/gangs234"
        }
      ]
    ]
  }
});

});

/* =========================
   BUTTON HANDLER
========================= */
bot.on("callback_query", (query) => {

  const chatId =
    query.message.chat.id;

  // refs
  if (query.data === "refs") {

    const count =
      users[chatId]?.refs || 0;

    bot.sendMessage(
      chatId,
`👥 *Referral Stats*

📊 Invited Users: *${count}*`,
      {
        parse_mode: "Markdown"
      }
    );
  }

  // balance
  if (
    query.data === "balance"
  ) {

    const balance =
      users[chatId]?.balance || 0;

    bot.sendMessage(
      chatId,
`💰 *Your Balance*

🪙 Coins: *${balance}*`,
      {
        parse_mode: "Markdown"
      }
    );
  }

  bot.answerCallbackQuery(
    query.id
  ).catch(() => {});
});

/* =========================
   COMMANDS
========================= */

// balance
bot.onText(/\/balance/, (msg) => {

  const chatId = msg.chat.id;

  const balance =
    users[chatId]?.balance || 0;

  bot.sendMessage(
    chatId,
`💰 *Your Balance*

🪙 Coins: *${balance}*`,
{
  parse_mode: "Markdown"
});

});

// refs
bot.onText(/\/refs/, (msg) => {

  const chatId = msg.chat.id;

  const refs =
    users[chatId]?.refs || 0;

  bot.sendMessage(
    chatId,
`👥 *Your Referrals*

📊 Total invited users: *${refs}*`,
{
  parse_mode: "Markdown"
});

});

// leaderboard
bot.onText(/\/top/, (msg) => {

  const topUsers =
    Object.entries(users)
    .map(([id, data]) => ({
      id,
      balance:
        data.balance || 0
    }))
    .sort(
      (a, b) =>
        b.balance - a.balance
    )
    .slice(0, 10);

  let text =
`🏆 *Top Earners*

`;

  topUsers.forEach((u, i) => {

    text +=
`${i + 1}. User ${u.id}
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

/* =========================
   BROADCAST
========================= */
bot.onText(
/\/broadcast (.+)/,
(msg, match) => {

  if (
    msg.chat.id !== ADMIN_ID
  ) return;

  const text = match[1];

  Object.keys(users)
  .forEach((id) => {

    bot.sendMessage(
      id,
      text
    ).catch(() => {});

  });

  bot.sendMessage(
    ADMIN_ID,
    "✅ Broadcast sent"
  );

});

/* =========================
   POST COMMAND
========================= */
bot.onText(
/\/post (.+)/,
(msg, match) => {

  // admin only
  if (
    msg.chat.id !== ADMIN_ID
  ) return;

  const text = match[1];

  sendEverywhere(
`📢 *NEW POST*

${text}`
  );

  bot.sendMessage(
    ADMIN_ID,
    "✅ Post sent successfully!"
  );

});

/* =========================
   DAILY BONUS
========================= */
function sendDailyBonus() {

  Object.keys(users)
  .forEach((id) => {

    users[id].balance += 1;

    bot.sendMessage(
      id,
`🎁 *Daily Bonus*

🪙 +1 coin added to your balance!`,
{
  parse_mode: "Markdown"
}
    ).catch(() => {});

  });

  saveUsers();
}

// every 24h
setInterval(
  sendDailyBonus,
  24 * 60 * 60 * 1000
);

/* =========================
   API POST
========================= */
app.post(
"/post",
(req, res) => {

  const text =
    req.body.text;

  if (!text) {

    return res.json({
      ok: false
    });

  }

  sendEverywhere(text);

  res.json({
    ok: true
  });

});

/* =========================
   EXPRESS SERVER
========================= */
app.get("/", (req, res) => {
  res.send(
    "🚀 StudyBuddy Bot Running"
  );
});

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    `🚀 Bot running on port ${PORT}`
  );

});
