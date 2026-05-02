const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "YOUR_BOT_TOKEN_HERE";
const bot = new TelegramBot(token, { polling: true });

const USERS_FILE = "users.json";

// Load users
let users = [];
if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

// Save users
function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users));
}

/* =========================
   SAVE USER ON START
========================= */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  if (!users.includes(chatId)) {
    users.push(chatId);
    saveUsers();
  }

  bot.sendMessage(chatId, `
🔥 Welcome to StudyBuddy!

💰 Start earning daily rewards
📚 Stay active and grow

🚀 Open daily and don't miss bonuses!
`);
});

/* =========================
   ADMIN BROADCAST COMMAND
========================= */
const ADMIN_ID = 123456789; // 🔴 PUT YOUR TELEGRAM ID

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const text = match[1];

  users.forEach((userId) => {
    bot.sendMessage(userId, text).catch(() => {});
  });

  bot.sendMessage(ADMIN_ID, "✅ Broadcast sent!");
});

/* =========================
   AUTO DAILY MESSAGE
========================= */
function sendDailyToUsers() {
  const message = `
⚠️ DAILY BONUS ALERT ⚠️

💰 Your rewards are ready!

👉 Open @Studybuddy_2025Bot
👉 Tap & complete tasks
👉 Claim today’s bonus

⏳ Only active users get rewards
🔥 Don't miss today!
`;

  users.forEach((userId) => {
    bot.sendMessage(userId, message).catch(() => {});
  });
}

// send every 24 hours
setInterval(sendDailyToUsers, 24 * 60 * 60 * 1000);

// send once when bot starts
sendDailyToUsers();

console.log("🚀 Bot running with user broadcast system");
