const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const postToChannel = require('./bot/sponsor');

// ======================
// 🔗 DB CONNECT
// ======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("DB Error:", err));

// ======================
// 🌐 ROUTES
// ======================

app.get('/', (req, res) => {
  res.send("🚀 Crypto App Running");
});

// 🔥 TEST ROUTE
app.get('/test-post', async (req, res) => {
  try {
    await postToChannel("🔥 Manual test post working");
    res.send("Posted to Telegram ✅");
  } catch (err) {
    res.send("Error posting ❌");
  }
});

// ======================
// 🔥 SAFE CRON WRAPPER
// ======================
function safePost(message) {
  postToChannel(message).catch(err => {
    console.log("Telegram Error:", err.message);
  });
}

// ======================
// ⏰ CRON JOBS (PRO FIXED)
// ======================

// ⏰ HOURLY POST
cron.schedule('0 * * * *', () => {
  console.log("⏰ Hourly cron triggered");

  safePost("⏰ Hourly Bonus Active 🚀");
}, {
  timezone: "Africa/Addis_Ababa"
});

// 📅 DAILY POST (9 AM)
cron.schedule('0 9 * * *', () => {
  console.log("📅 Daily cron triggered");

  safePost("📅 Daily Reward Available 🎁");
}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// 🚀 START SERVER
// ======================

const PORT = process.env.PORT || 10000;

app.listen(PORT, async () => {
  console.log("Server running on port", PORT);

  // safer startup message (only once per deploy)
  safePost("🤖 Bot started successfully 🚀");
});
