const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// ======================
// BOT FUNCTION
// ======================
const postToChannel = require("./bot/sponsor");

// ======================
// DB CONNECT
// ======================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("DB Error:", err));

// ======================
// BASIC ROUTE
// ======================
app.get("/", (req, res) => {
  res.send("🚀 Crypto App Running");
});

// ======================
// TEST POST ROUTE
// ======================
app.post("/post", async (req, res) => {
  const { message } = req.body;

  await postToChannel(message);

  res.json({ success: true, message: "Posted ✅" });
});

// ======================
// MOTIVATION SYSTEM
// ======================

const messages = [
"🔥 Keep going! Success is near!",
"💰 Every tap brings you closer to wealth!",
"🚀 Don’t stop now — you’re building your future!",
"⚡ Winners never quit, quitters never win!",
"📈 Small steps = Big results!",
"💎 Stay consistent and get rewarded!"
];

function getRandomMessage() {
  return messages[Math.floor(Math.random() * messages.length)];
}

// ======================
// ⏰ EVERY 2 HOURS POST
// ======================
cron.schedule("0 */2 * * *", async () => {
  console.log("⏰ 2 Hour Motivation Triggered");

  const msg = getRandomMessage();

  await postToChannel(`
🐍 *Crypto Tap Pro Motivation*

${msg}

💪 Stay active and keep earning!
  `);

}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// DAILY BONUS POST (OPTIONAL)
// ======================
cron.schedule("0 9 * * *", async () => {
  console.log("📅 Daily Bonus Triggered");

  await postToChannel(`
🎁 *Daily Reward Time!*

🔥 New bonus is available now!
💰 Log in and claim your reward!
  `);

}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// START SERVER
// ======================
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);

  postToChannel("🤖 Bot is online & 2-hour scheduler started");
});
