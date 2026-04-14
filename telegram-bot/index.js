const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const cron = require("node-cron");
require("dotenv").config();

// BOT
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// DATABASE CONNECT
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log(err));

// USER MODEL (same structure as your app)
const User = mongoose.model("User", new mongoose.Schema({
  username: String,
  coins: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
}));

const channel = process.env.CHANNEL;

console.log("🤖 Bot is running...");

---

/**
 * 🔥 DAILY REPORT POST (9 AM)
 */
cron.schedule("0 9 * * *", async () => {
  try {
    const totalUsers = await User.countDocuments();

    const topUsers = await User.find()
      .sort({ coins: -1 })
      .limit(5);

    const totalCoinsAgg = await User.aggregate([
      { $group: { _id: null, sum: { $sum: "$coins" } } }
    ]);

    const totalCoins = totalCoinsAgg[0]?.sum || 0;

    let msg = `🔥 DAILY CRYPTO APP REPORT 🔥\n\n`;
    msg += `👥 Users: ${totalUsers}\n`;
    msg += `💰 Total Coins: ${totalCoins}\n\n`;
    msg += `🏆 TOP USERS:\n`;

    topUsers.forEach((u, i) => {
      msg += `${i + 1}. ${u.username || "User"} - ${u.coins} coins\n`;
    });

    bot.sendMessage(channel, msg);

  } catch (err) {
    console.log("Daily report error:", err);
  }
});

---

/**
 * 🚀 NEW USER WELCOME POST
 */
cron.schedule("*/30 * * * *", async () => {
  try {
    const latestUsers = await User.find()
      .sort({ createdAt: -1 })
      .limit(1);

    if (latestUsers.length > 0) {
      const u = latestUsers[0];

      const msg = `🎉 NEW PLAYER JOINED!\n\n👤 ${u.username || "User"}\n💰 Coins: ${u.coins}\n🔥 Start tapping now!`;

      bot.sendMessage(channel, msg);
    }
  } catch (err) {
    console.log(err);
  }
});

---

/**
 * 🔥 MANUAL COMMAND (optional test)
 */
bot.onText(/\/stats/, async (msg) => {
  const totalUsers = await User.countDocuments();

  bot.sendMessage(msg.chat.id,
    `📊 APP STATS:\n👥 Users: ${totalUsers}`
  );
});
