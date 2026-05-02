const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

// 🔑 BOT TOKEN
const token = "8344006616:AAFtsVrXi8xRAtbyWHeMxsXk_X3ntE3xRMk";

const bot = new TelegramBot(token, { polling: true });

// 📢 INFO
const CHANNEL = "@gangs234";
const BOT_USERNAME = "Studybuddy_2025Bot";

// 📁 USERS DATABASE
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

/* =========================
   START COMMAND (SAVE USER)
========================= */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  // ✅ SAVE USER
  if (!users.includes(chatId)) {
    users.push(chatId);
    saveUsers();
  }

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
        [{ text: "📢 Join Channel", url: "https://t.me/gangs234" }],
        [{ text: "🚀 Start Earning", url: `https://t.me/${BOT_USERNAME}` }]
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
        [{ text: "🚀 Start Bot", url: `https://t.me/${BOT_USERNAME}` }],
        [{ text: "📢 Join Channel", url: "https://t.me/gangs234" }]
      ]
    }
  });
}

/* =========================
   🔥 DAILY MESSAGE TO USERS
========================= */
function sendDailyToUsers() {
  const message = `
🚨 DAILY REMINDER 🚨

💰 Your coins are waiting!

👉 Open @Studybuddy_2025Bot
👉 Tap & earn today’s reward

⏳ Skip = lose coins
🔥 Stay active daily!
`;

  users.forEach((userId) => {
    bot.sendMessage(userId, message).catch(() => {});
  });
}

/* =========================
   🔥 ADMIN BROADCAST
========================= */
const ADMIN_ID = 7154361039; // 🔴 PUT YOUR TELEGRAM ID

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text = match[1];

  users.forEach((userId) => {
    bot.sendMessage(userId, text).catch(() => {});
  });

  bot.sendMessage(ADMIN_ID, "✅ Broadcast sent to users!");
});

/* =========================
   AUTO SYSTEM
========================= */

// channel post every 24h
setInterval(sendDailyPost, 24 * 60 * 60 * 1000);

// user reminder every 24h
setInterval(sendDailyToUsers, 24 * 60 * 60 * 1000);

// run once on start
sendDailyPost();
sendDailyToUsers();

console.log("🚀 StudyBuddy Bot running with FULL system");
