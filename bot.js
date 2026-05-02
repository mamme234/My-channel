const TelegramBot = require("node-telegram-bot-api");

const token = "8344006616:AAFtsVrXi8xRAtbyWHeMxsXk_X3ntE3xRMk";
const bot = new TelegramBot(token, { polling: true });

const CHANNEL = "@gangs234";
const BOT_USERNAME = "Studybuddy_2025Bot";

/* START */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, `
🔥 WELCOME TO STUDYBUDDY

💰 Tap daily and earn rewards
🚀 Stay active to grow
`, {
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
            web_app: {
              url: "https://myapp1-khaki.vercel.app/"
            }
          }
        ]
      ]
    }
  });
});

/* CHANNEL POST */
function sendDailyPost() {
  bot.sendMessage(CHANNEL, `
⚠️ DAILY BONUS ALERT

💰 Open app and claim reward today!

⏳ Only active users benefit
`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Start Earning",
            url: "https://myapp1-khaki.vercel.app/"
          }
        ]
      ]
    }
  });
}

/* AUTO DAILY */
setInterval(sendDailyPost, 24 * 60 * 60 * 1000);
sendDailyPost();

console.log("Bot running...");
