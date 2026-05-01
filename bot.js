const TelegramBot = require("node-telegram-bot-api");

// 🔑 BOT TOKEN (replace this)
const token = "YOUR_BOT_TOKEN_HERE";

const bot = new TelegramBot(token, { polling: true });

// 📢 Your channel + bot info
const CHANNEL = "@gangs234";
const BOT_USERNAME = "Studybuddy_2025Bot";

/* =========================
   START COMMAND
========================= */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  const message = `
🔥 WELCOME TO STUDYBUDDY 🔥

💰 Learn, Tap & Earn Daily Rewards
📚 Stay active to unlock bonuses

⚠️ Inactive users miss daily rewards
🚀 Start now and grow your balance!
`;

  bot.sendMessage(chatId, message, {
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
            text: "🚀 Start Earning",
            url: `https://t.me/${BOT_USERNAME}`
          }
        ]
      ]
    }
  });
});

/* =========================
   DAILY CHANNEL POST
========================= */
function sendDailyPost() {
  const message = `
⚠️ DAILY BONUS ALERT ⚠️

💰 Your rewards are ready today!

👉 Open bot @Studybuddy_2025Bot
👉 Complete daily tasks
👉 Claim your reward instantly

⏳ Only active users get bonuses
🔥 Stay active, earn more daily!
`;

  bot.sendMessage(CHANNEL, message, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Start Bot",
            url: `https://t.me/${BOT_USERNAME}`
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
}

/* =========================
   AUTO DAILY SYSTEM (24H)
========================= */
setInterval(() => {
  sendDailyPost();
}, 24 * 60 * 60 * 1000);

// send once when bot starts
sendDailyPost();

/* =========================
   OPTIONAL: FORCE ACTIVITY MESSAGE
========================= */
bot.on("callback_query", (query) => {
  if (query.data === "start") {
    bot.sendMessage(
      query.message.chat.id,
      "🚀 Open the bot and start earning coins daily!"
    );
  }
});

console.log("🚀 StudyBuddy Bot is running...");
