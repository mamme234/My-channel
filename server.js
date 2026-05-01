const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

// ======================
// BOT IMPORT
// ======================
const postToChannel = require("./bot/sponsor");

// ======================
// BOT LINK
// ======================
const BOT_LINK = "https://t.me/Studybuddy_2025Bot";

// ======================
// DB CONNECT
// ======================
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("DB Error:", err));

// ======================
// HOME ROUTE
// ======================
app.get("/", (req, res) => {
  res.send("🚀 Venoms Channel Server Running");
});

// ======================
// POST API (for frontend)
// ======================
app.post("/post", async (req, res) => {
  const { message } = req.body;

  await postToChannel(message);

  res.json({ success: true });
});

// ======================
// CLEAN MOTIVATION POSTS
// ======================
const posts = [
`🐍 VENOMS POWER

🔥 Success is built daily — not overnight

💰 Tap • Earn • Grow

🚀 Start here: ${BOT_LINK}`,

`🚀 DON’T WAIT

💎 Early users always win more

⚡ Join now and start earning

👉 ${BOT_LINK}`,

`🔥 DAILY MOTIVATION

💪 Discipline creates success

💰 Your first step starts today

🚀 Join: ${BOT_LINK}`,

`⚡ VENOMS ALERT

📈 Growth happens when you start

💰 Don’t miss early rewards

👉 ${BOT_LINK}`
];

function getPost() {
  return posts[Math.floor(Math.random() * posts.length)];
}

// ======================
// ⏰ EVERY 2 HOURS POST
// ======================
cron.schedule("0 */2 * * *", async () => {
  console.log("⏰ 2-hour post running");

  try {
    await postToChannel(getPost());
  } catch (err) {
    console.log("Telegram error:", err.message);
  }

}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// DAILY BOOST POST (9 AM)
// ======================
cron.schedule("0 9 * * *", async () => {
  console.log("📅 Daily post running");

  await postToChannel(`
🎁 DAILY BONUS TIME

🔥 New rewards are active now!

💰 Tap & earn inside the app

🚀 Start: ${BOT_LINK}
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

  postToChannel("🤖 Venoms Bot is online & scheduler active");
});
