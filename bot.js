const TelegramBot = require("node-telegram-bot-api");
const express = require("express");
const fs = require("fs");

const app = express();
app.use(express.json());

/* =========================
   ENV TOKEN
========================= */
const token = process.env.BOT_TOKEN;

if (!token) {
  console.log("Missing BOT_TOKEN");
  process.exit(1);
}

const bot = new TelegramBot(token, { polling: true });

const BOT_USERNAME = "Studybuddy_2025Bot";

/* =========================
   DATABASE
========================= */
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

try {
  users = JSON.parse(fs.readFileSync("users.json", "utf8"));
} catch (e) {
  users = {};
}

function saveUsers() {
  fs.writeFileSync("users.json", JSON.stringify(users, null, 2));
}

/* =========================
   REF LINK
========================= */
function getLink(id) {
  return `https://t.me/${BOT_USERNAME}?start=ref${id}`;
}

/* =========================
   START + REF SYSTEM
========================= */
bot.onText(/\/start(?: (.+))?/, (msg, match) => {
  const id = msg.chat.id;
  const param = match?.[1];

  if (!users[id]) {
    users[id] = {
      refs: 0,
      balance: 0,
      referredBy: null
    };
  }

  // referral handling
  if (param && param.startsWith("ref")) {
    const refId = param.replace("ref", "");

    if (
      refId !== String(id) &&
      users[id].referredBy === null &&
      users[refId]
    ) {
      users[id].referredBy = refId;

      users[refId].refs += 1;
      users[refId].balance += 10; // reward

      saveUsers();

      bot.sendMessage(refId, "🎉 +10 coins from referral!");
    }
  }

  saveUsers();

  const u = users[id];

  bot.sendMessage(
    id,
`🔥 *WELCOME TO STUDYBUDDY* 🔥

💰 Balance: *${u.balance} coins*
👥 Referrals: *${u.refs}*

🔗 Your link:
${getLink(id)}

Invite friends & earn coins!`,
    { parse_mode: "Markdown" }
  );
});

/* =========================
   BALANCE
========================= */
bot.onText(/\/balance/, (msg) => {
  const id = msg.chat.id;

  const balance = users[id]?.balance || 0;

  bot.sendMessage(
    id,
`💰 *Your Balance*

🪙 Coins: *${balance}*`,
    { parse_mode: "Markdown" }
  );
});

/* =========================
   REF COUNT
========================= */
bot.onText(/\/refs/, (msg) => {
  const id = msg.chat.id;

  const refs = users[id]?.refs || 0;

  bot.sendMessage(
    id,
`👥 *Your Referrals*

📊 You invited: *${refs} users*`,
    { parse_mode: "Markdown" }
  );
});

/* =========================
   TOP USERS
========================= */
bot.onText(/\/top/, (msg) => {
  const top = Object.entries(users)
    .map(([id, d]) => ({
      id,
      balance: d.balance || 0
    }))
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 5);

  let text = "🏆 *Top Earners*\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. User ${u.id} — ${u.balance} coins\n`;
  });

  bot.sendMessage(msg.chat.id, text, { parse_mode: "Markdown" });
});

/* =========================
   EXPRESS SERVER
========================= */
app.get("/", (req, res) => {
  res.send("Bot running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Bot running on port", PORT);
});
