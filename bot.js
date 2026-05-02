const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const token = "PUT_NEW_TOKEN_HERE";
const bot = new TelegramBot(token, { polling: true });

const BOT_USERNAME = "Studybuddy_2025Bot";
const MINI_APP = `https://t.me/${BOT_USERNAME}/app`;

const ADMIN_ID = 7154361039;

const USERS_FILE = "users.json";
let users = {}; 
// format:
// { userId: { balance: 0, ref: null, lastClaim: 0 } }

if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUser(id) {
  if (!users[id]) {
    users[id] = { balance: 0, ref: null, lastClaim: 0 };
  }
  return users[id];
}

function getDeepLink(ref = "") {
  return ref ? `${MINI_APP}?startapp=${ref}` : MINI_APP;
}

/* =========================
   START + REF SYSTEM
========================= */
bot.onText(/\/start(.*)/, (msg, match) => {
  const id = msg.chat.id;
  const ref = match[1].trim();

  const user = getUser(id);

  // referral tracking
  if (ref && ref !== id.toString()) {
    user.ref = ref;

    // reward referrer
    const refUser = getUser(ref);
    refUser.balance += 5;
  }

  saveUsers();

  bot.sendMessage(id, `
🔥 Welcome to StudyBuddy

💰 Earn daily rewards
⚡ Tap & grow your balance
📊 Invite friends to earn more
`, {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "⚡ Start Earning",
            url: getDeepLink("welcome")
          }
        ]
      ]
    }
  });
});

/* =========================
   DAILY REWARD SYSTEM
========================= */
function claimDaily(userId) {
  const user = getUser(userId);
  const now = Date.now();

  const DAY = 24 * 60 * 60 * 1000;

  if (now - user.lastClaim < DAY) {
    return false;
  }

  user.balance += 10;
  user.lastClaim = now;
  saveUsers();

  return true;
}

/* =========================
   DAILY MESSAGE
========================= */
function sendDailyToUsers() {
  Object.keys(users).forEach(id => {
    bot.sendMessage(id, `
🚨 Daily Reward Available

💰 Tap to claim your reward
⚡ Stay active for bonuses
`, {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "💰 Claim Reward",
              callback_data: "claim"
            }
          ]
        ]
      }
    }).catch(() => {});
  });
}

/* =========================
   CLAIM BUTTON
========================= */
bot.on("callback_query", (q) => {
  const id = q.from.id;

  if (q.data === "claim") {
    const ok = claimDaily(id);

    if (ok) {
      bot.answerCallbackQuery(q.id, { text: "✅ Reward added!" });
      bot.sendMessage(id, "💰 You received +10 coins!");
    } else {
      bot.answerCallbackQuery(q.id, { text: "⏳ Already claimed today" });
    }
  }
});

/* =========================
   BALANCE CHECK
========================= */
bot.onText(/\/balance/, (msg) => {
  const user = getUser(msg.chat.id);

  bot.sendMessage(msg.chat.id, `
💰 Your Balance: ${user.balance} coins
👥 Referral: ${user.ref || "none"}
`);
});

/* =========================
   WITHDRAW SYSTEM
========================= */
bot.onText(/\/withdraw (.+)/, (msg, match) => {
  const id = msg.chat.id;
  const amount = parseInt(match[1]);

  const user = getUser(id);

  if (user.balance < amount) {
    return bot.sendMessage(id, "❌ Not enough balance");
  }

  user.balance -= amount;
  saveUsers();

  bot.sendMessage(ADMIN_ID, `
💸 Withdrawal Request

User: ${id}
Amount: ${amount}
`);

  bot.sendMessage(id, "⏳ Withdrawal sent for approval");
});

/* =========================
   ADMIN APPROVAL
========================= */
bot.onText(/\/approve (.+) (.+)/, (msg, match) => {
  if (msg.chat.id != ADMIN_ID) return;

  const userId = match[1];
  const amount = match[2];

  bot.sendMessage(userId, `✅ Withdrawal of ${amount} approved!`);
});

/* =========================
   REF LINK GENERATOR
========================= */
bot.onText(/\/ref/, (msg) => {
  const id = msg.chat.id;

  bot.sendMessage(id, `
🔗 Your Referral Link:

https://t.me/${BOT_USERNAME}?start=${id}

💰 Earn 5 coins per invite
`);
});

/* =========================
   DAILY SCHEDULER
========================= */
setInterval(sendDailyToUsers, 24 * 60 * 60 * 1000);

console.log("🚀 StudyBuddy upgraded bot running");
