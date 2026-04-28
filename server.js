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
