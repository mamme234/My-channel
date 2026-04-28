const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cron = require('node-cron');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const postToChannel = require('./bot/sponsor');
const User = require('./models/User');

// ======================
// DB CONNECT
// ======================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// ======================
// ROOT
// ======================
app.get('/', (req, res) => {
  res.send("🚀 PRO APP RUNNING");
});

// ======================
// 🖱️ TAP SYSTEM
// ======================
const lastPost = {};

app.post('/api/tap', async (req, res) => {
  const { username } = req.body;

  if (!username) return res.json({ error: "No username" });

  let user = await User.findOne({ username);
  if (!user) user = new User({ username });

  const now = Date.now();

  // anti-spam tap
  if (now - user.lastTap < 1000) {
    return res.json({ error: "Too fast" });
  }

  user.coins += 1;
  user.lastTap = now;
  await user.save();

  // 🧠 smart post (limit per user)
  if (!lastPost[username] || now - lastPost[username] > 120000) {

    const messages = [
      `🔥 ${username} is on fire!`,
      `💰 ${username} is earning fast!`,
      `🚀 ${username} is climbing up!`,
      `🎯 ${username} keeps grinding!`
    ];

    const msg = messages[Math.floor(Math.random() * messages.length)];
    postToChannel(msg);

    lastPost[username] = now;
  }

  res.json({ coins: user.coins });
});
// ======================
// GLOBAL MOTIVATION (every 2 hours)
// ======================
const globalMessages = [
  "🔥 Keep earning!",
  "💰 Stay active!",
  "🚀 Don’t stop!",
  "🎯 Stay consistent!"
];

cron.schedule('0 */2 * * *', () => {
  const msg = globalMessages[Math.floor(Math.random() * globalMessages.length)];
  postToChannel(`📢 ${msg}`);
}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// LEADERBOARD (every 6 hours)
// ======================
cron.schedule('0 */6 * * *', async () => {
  const top = await User.find().sort({ coins: -1 }).limit(5);

  let text = `🏆 Top Users\n\n`;
  top.forEach((u, i) => {
    text += `${i + 1}. ${u.username} - ${u.coins} 🪙\n`;
  });

  postToChannel(text);
}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// DAILY STATS
// ======================
cron.schedule('0 20 * * *', async () => {
  const totalUsers = await User.countDocuments();
  const coins = await User.aggregate([
    { $group: { _id: null, total: { $sum: "$coins" } } }
  ]);

  const totalCoins = coins[0]?.total || 0;

  postToChannel(`
📊 Stats

👥 Users: ${totalUsers}
🪙 Coins: ${totalCoins}
  `);
}, {
  timezone: "Africa/Addis_Ababa"
});

// ======================
// DAILY REWARD
// ======================
cron.schedule('0 9 * * *', () => {
  postToChannel("🎁 Daily reward is live!");
}, {
  timezone: "Africa/Addis_Ababa"
});const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
