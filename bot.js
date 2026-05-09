const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "8344006616:AAFkf3s7tKQaqSYm1d-4d1yMbIOoKpQFB7Q";

const bot = new TelegramBot(token, {
  polling: true
});

const CHANNEL = "@gangs234";
const BOT_USERNAME = "Studybuddy_2025Bot";
const MINI_APP = "https://myapp1-khaki.vercel.app/";
const GROUP_ID = "--1003984859530";
const USERS_FILE = "users.json";

let users = [];

// Load users
if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

// Save users
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

/* START COMMAND */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // Save user
  if (!users.includes(chatId)) {
    users.push(chatId);
    saveUsers();
  }

  const text = `
🔥 WELCOME TO STUDYBUDDY

💰 Earn rewards daily
🚀 Open app and stay active
`;

  bot.sendMessage(chatId, text, {
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
            text: "📢 Join Channel",
            url: "https://t.me/gangs234"
          }
        ]
      ]
    }
  });
});

/* DAILY CHANNEL POST */
function sendDailyPost() {
  const text = `
🚨 DAILY LOGIN ALERT

💰 Your reward is waiting!
⏳ Open app before today ends.
`;

  function sendDailyPost() {
  const text = `
🚨 DAILY BONUS ALERT 🚨

💰 Your reward is waiting!
⏳ Open now before today ends.

🔥 Stay active daily.
`;

  const options = {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "🚀 Start Earning",
            url: "https://t.me/Studybuddy_2025Bot/app"
          }
        ]
      ]
    }
  };

  // POST TO CHANNEL
  bot.sendMessage(CHANNEL, text, options);

  // POST TO GROUP
  bot.sendMessage(GROUP_ID, text, options);
}

/* DAILY USER REMINDER */
function sendDailyReminder() {
  const text = `
⚠️ DAILY BONUS READY

🎁 Open the app now and claim reward.
`;

  users.forEach((userId) => {
    bot.sendMessage(userId, text, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Open App",
              web_app: {
                url: MINI_APP
              }
            }
          ]
        ]
      }
    }).catch(() => {});
  });
}

/* AUTO SYSTEM */
setInterval(sendDailyPost, 24 * 60 * 60 * 1000);

setInterval(sendDailyReminder, 24 * 60 * 60 * 1000);

// Run once
sendDailyPost();
sendDailyReminder();

console.log("🚀 StudyBuddy system running");
