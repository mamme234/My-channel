const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

/* =========================
   ENV CONFIG (IMPORTANT)
========================= */
const token = process.env.BOT_TOKEN;

if (!token) {
  console.log("❌ BOT_TOKEN missing in environment variables");
  process.exit(1);
}

/* =========================
   BOT (WEBHOOK SAFE OPTION)
========================= */
const bot = new TelegramBot(token, {
  polling: true
});

/* =========================
   CONSTANTS
========================= */
const CHANNEL = "@gangs234";
const GROUP_ID = "-1003984859530";

const MINI_APP = "https://t.me/Studybuddy_2025Bot?startapp=main";

/* =========================
   SAFE USERS STORAGE
========================= */
const USERS_FILE = "users.json";

let users = new Set();

// load safely
try {
  const data = fs.readFileSync(USERS_FILE, "utf8");
  JSON.parse(data).forEach(id => users.add(id));
} catch (e) {
  users = new Set();
}

// safe save (debounced)
let saveTimeout;
function saveUsers() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    fs.writeFileSync(
      USERS_FILE,
      JSON.stringify([...users], null, 2)
    );
  }, 1000);
}

/* =========================
   BROADCAST ENGINE
========================= */
function sendEverywhere(text) {
  const options = {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "🚀 Open App", url: MINI_APP }]
      ]
    }
  };

  bot.sendMessage(CHANNEL, text, options).catch(() => {});
  bot.sendMessage(GROUP_ID, text, options).catch(() => {});
}

/* =========================
   START COMMAND
========================= */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;

  users.add(chatId);
  saveUsers();

  bot.sendMessage(
    chatId,
`🔥 *WELCOME TO STUDYBUDDY* 🔥

💰 Earn rewards daily
🚀 Open app & play
🎁 Watch ads & get bonus

Stay active!`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🚀 Start",
              web_app: { url: "https://myapp1-khaki.vercel.app/" }
            }
          ],
          [
            {
              text: "📢 Channel",
              url: "https://t.me/gangs234"
            }
          ]
        ]
      }
    }
  );
});

/* =========================
   API POST
========================= */
app.post("/post", (req, res) => {
  const text = req.body.text;

  if (!text) {
    return res.json({ ok: false, error: "No text" });
  }

  sendEverywhere(text);

  res.json({ ok: true });
});

/* =========================
   DAILY SYSTEM (SAFE LOOP)
========================= */
function dailyPost() {
  sendEverywhere(
`🔥 *DAILY BONUS* 🔥

💰 Claim your rewards
🚀 Open app now
🎁 Earn more daily`
  );
}

function dailyUsers() {
  users.forEach((id) => {
    bot.sendMessage(
      id,
`🚨 *DAILY REMINDER*

💰 Your rewards are waiting
🚀 Open app & claim now`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "🚀 Open App",
                web_app: { url: "https://myapp1-khaki.vercel.app/" }
              }
            ]
          ]
        }
      }
    ).catch(() => {});
  });
}

/* =========================
   BROADCAST (ADMIN ONLY)
========================= */
const ADMIN_ID = 7154361039;

bot.onText(/\/broadcast (.+)/, (msg, match) => {
  if (msg.chat.id !== ADMIN_ID) return;

  const text = match[1];

  users.forEach(id => {
    bot.sendMessage(id, text).catch(() => {});
  });

  bot.sendMessage(ADMIN_ID, "✅ Broadcast sent");
});

/* =========================
   INTERVAL (OPTIMIZED)
========================= */
setInterval(() => {
  dailyPost();
  dailyUsers();
}, 24 * 60 * 60 * 1000);

dailyPost();

/* =========================
   EXPRESS SERVER
========================= */
app.get("/", (req, res) => {
  res.send("StudyBuddy Bot Running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("🚀 Bot running on port", PORT);
});
