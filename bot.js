const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

/* =========================
   BOT TOKEN
========================= */
const token = "8344006616:AAFClZSZWBsPoT4rbf6Y0DafuqPX6lGVfoY";

const bot = new TelegramBot(token, {
  polling: true
});

/* =========================
   INFO
========================= */
const CHANNEL = "@gangs234";
const GROUP_ID = "-1003984859530";

const BOT_USERNAME = "Studybuddy_2025Bot";

const MINI_APP =
  "https://t.me/Studybuddy_2025Bot?startapp=main";

/* =========================
   USERS DATABASE
========================= */
const USERS_FILE = "users.json";

let users = [];

if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

/* =========================
   SEND EVERYWHERE
========================= */
function sendEverywhere(text) {

  // channel
  bot.sendMessage(CHANNEL, text, {
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
  }).catch(console.log);

  // group
  bot.sendMessage(GROUP_ID, text, {
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
  }).catch(console.log);
}

/* =========================
   START COMMAND
========================= */
bot.onText(/\/start/, (msg) => {

  const chatId = msg.chat.id;

  // save user
  if (!users.includes(chatId)) {
    users.push(chatId);
    saveUsers();
  }

  bot.sendMessage(chatId,
`🔥 *WELCOME TO CRYPTO TAP PRO* 🔥

💰 Tap coins daily
🚀 Earn rewards
🎁 Watch ads for bonus coins

⚡ Stay active every day!`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🚀 Start Earning",
          web_app: {
            url: "https://myapp1-khaki.vercel.app/"
          }
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
   POST API FROM APP
========================= */
app.post("/post", async (req, res) => {

  const text = req.body.text;

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
   DAILY POST
========================= */
function sendDailyPost() {

  sendEverywhere(
`🔥 *DAILY BONUS ALERT* 🔥

💰 Your rewards are waiting!

🚀 Open the app now
🎁 Watch ads & earn more
⚡ Active users earn daily

👇 Start now!`
  );

}

/* =========================
   DAILY MESSAGE TO USERS
========================= */
function sendDailyToUsers() {

  users.forEach((userId) => {

    bot.sendMessage(userId,
`🚨 *DAILY REMINDER* 🚨

💰 Your coins are waiting!

🔥 Open the app now and claim rewards.`,
{
  parse_mode: "Markdown",
  reply_markup: {
    inline_keyboard: [
      [
        {
          text: "🚀 Open App",
          web_app: {
            url: "https://myapp1-khaki.vercel.app/"
          }
        }
      ]
    ]
  }
}).catch(() => {});

  });

}

/* =========================
   BROADCAST
========================= */
const ADMIN_ID = 7154361039;

bot.onText(/\/broadcast (.+)/, (msg, match) => {

  if (msg.chat.id != ADMIN_ID) return;

  const text = match[1];

  users.forEach((userId) => {

    bot.sendMessage(userId, text).catch(() => {});

  });

  bot.sendMessage(
    ADMIN_ID,
    "✅ Broadcast sent!"
  );

});

/* =========================
   AUTO SYSTEM
========================= */

// every 24h
setInterval(sendDailyPost, 24 * 60 * 60 * 1000);

// every 24h
setInterval(sendDailyToUsers, 24 * 60 * 60 * 1000);

// run once on startup
sendDailyPost();

/* =========================
   EXPRESS SERVER
========================= */
app.get("/", (req, res) => {
  res.send("StudyBuddy Bot Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 StudyBuddy system running");
});
