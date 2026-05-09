const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "8344006616:AAFtsVrXi8xRAtbyWHeMxsXk_X3ntE3xRMk";
const bot = new TelegramBot(token, { polling: true });

const CHANNEL = "@gangs234";
const BOT_USERNAME = "Studybuddy_2025Bot";
const MINI_APP = "https://myapp1-khaki.vercel.app/";
const USERS_FILE = "users.json";
const ADMIN_ID = 7154361039;

let users = [];

if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

// START
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;

  if (!users.includes(chatId)) {
    users.push(chatId);
    saveUsers();
  }

  const text = `
🔥 WELCOME TO STUDYBUDDY

💰 Earn rewards daily
🎁 Complete tasks and stay active
⚡ Open the app every day to grow faster
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
          web_app: {
            url: "https://myapp1-khaki.vercel.app/"
          }
        }
      ]
    ]
  }
});

// DAILY CHANNEL POST
function sendDailyPost() {
  const text = `
🚨 DAILY LOGIN ALERT 🚨

💎 Your daily reward is waiting!
⏰ Open now before today ends.

🔥 Active users earn more every day.
`;

  bot.sendMessage(CHANNEL, text, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "💰 Earn My $",
            url: `https://t.me/${BOT_USERNAME}/app`
          }
        ]
      ]
    }
  });
}

// DAILY MESSAGE TO USERS
function sendDailyReminder() {
  const text = `
⚠️ DAILY BONUS READY ⚠️

🎁 Your reward is available now.
🚀 Open the app and claim it.

⏳ Missing today = losing rewards.
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

// ADMIN BROADCAST
bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id !== ADMIN_ID) return;

  const text = match[1];

  users.forEach((userId) => {
    bot.sendMessage(userId, text).catch(() => {});
  });

  bot.sendMessage(ADMIN_ID, "✅ Broadcast sent");
});

// AUTO SYSTEM
setInterval(sendDailyPost, 24 * 60 * 60 * 1000);
setInterval(sendDailyReminder, 24 * 60 * 60 * 1000);

sendDailyPost();
sendDailyReminder();

console.log("🚀 StudyBuddy system running");
