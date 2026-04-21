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
  .catch(err => console.log(err));

// ======================
// 🌐 ROUTES
// ======================

app.get('/', (req, res) => {
  res.send("🚀 Crypto App Running");
});

// 🔥 TEST ROUTE
app.get('/test-post', async (req, res) => {
  await postToChannel("🔥 Manual test post working");
  res.send("Posted to Telegram ✅");
});

// ======================
// ⏰ CRON JOBS (FIXED)
// ======================

// 🧪 TEST EVERY MINUTE (REMOVE AFTER TEST)
cron.schedule('*/1 * * * *', () => {
  console.log("🔥 TEST CRON RUNNING EVERY MINUTE");

  postToChannel("🔥 Cron test working (every minute)");
}, {
  timezone: "Africa/Addis_Ababa"
});

// ⏰ HOURLY POST
cron.schedule('0 * * * *', () => {
  console.log("⏰ Hourly cron triggered");

  postToChannel("⏰ Hourly Bonus Active 🚀");
}, {
  timezone: "Africa/Addis_Ababa"
});

// 📅 DAILY POST (9 AM ETHIOPIA TIME)
cron.schedule('0 9 * * *', () => {
  console.log("📅 Daily cron triggered");

  postToChannel("📅 Daily Reward Available 🎁");
}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// 🚀 START SERVER
// ======================

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);

  // startup message (optional)
  postToChannel("🤖 Bot is live and scheduler started");
});
