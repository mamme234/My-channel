const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// bot system
const postToChannel = require('./bot/sponsor');

// DB connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"));

// ======================
// 💰 EARN API (SAFE)
// ======================
app.post('/api/earn', async (req, res) => {
  const { username, coins } = req.body;

  if (!username || !coins || coins > 100) {
    return res.status(400).json({ error: "Invalid request" });
  }

  postToChannel(`💰 Earn Update\n👤 ${username}\n🪙 +${coins}`);

  res.json({ success: true });
});

// ======================
// 🏆 LEADERBOARD (basic)
// ======================
app.get('/api/leaderboard', (req, res) => {
  res.json([
    { user: "Ali", coins: 1200 },
    { user: "Sara", coins: 900 }
  ]);
});

// ======================
// 💸 WITHDRAW (basic)
// ======================
app.post('/api/withdraw', (req, res) => {
  const { username, amount } = req.body;

  postToChannel(`💸 Withdrawal Request\n👤 ${username}\n💰 $${amount}`);

  res.json({ success: true });
});

// ======================
// ⏰ SCHEDULER (PRO)
// ======================

// hourly update
cron.schedule('0 * * * *', () => {
  postToChannel("⏰ Hourly Bonus Active 🚀");
});

// daily update
cron.schedule('0 9 * * *', () => {
  postToChannel("📅 Daily Reward is live 🎁");
});

// ======================
app.get('/', (req, res) => {
  res.send("Crypto Pro App Running 🚀");
});

app.listen(process.env.PORT || 10000, () => {
  console.log("Server running");
});
