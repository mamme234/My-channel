const TelegramBot = require("node-telegram-bot-api");
const mongoose = require("mongoose");
const cron = require("node-cron");
require("dotenv").config();

const User = require("./models/User");

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

const channel = process.env.CHANNEL;

console.log("Bot running...");

bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;
  const username = msg.from.username || "User";

  let user = await User.findOne({ userId });

  if (!user) {
    user = new User({ userId, username });
    await user.save();
  }

  bot.sendMessage(msg.chat.id,
    `👋 Welcome ${username}!\n💰 Start tapping to earn coins.`
  );
});

bot.onText(/\/tap/, async (msg) => {
  const userId = msg.from.id;

  const user = await User.findOne({ userId });
  if (!user) return;

  user.coins += 1;
  await user.save();

  bot.sendMessage(msg.chat.id, `🔥 +1 coin added! Total: ${user.coins}`);
});

bot.onText(/\/top/, async (msg) => {
  const top = await User.find().sort({ coins: -1 }).limit(5);

  let text = "🏆 TOP USERS:\n\n";

  top.forEach((u, i) => {
    text += `${i + 1}. ${u.username} - ${u.coins} coins\n`;
  });

  bot.sendMessage(msg.chat.id, text);
});

cron.schedule("0 9 * * *", async () => {
  const users = await User.countDocuments();

  const totalCoins = await User.aggregate([
    { $group: { _id: null, sum: { $sum: "$coins" } } }
  ]);

  const top = await User.find().sort({ coins: -1 }).limit(3);

  let msg = `🔥 DAILY REPORT 🔥\n\n`;
  msg += `👥 Users: ${users}\n`;
  msg += `💰 Coins: ${totalCoins[0]?.sum || 0}\n\n`;
  msg += `🏆 Top:\n`;

  top.forEach((u, i) => {
    msg += `${i + 1}. ${u.username} - ${u.coins}\n`;
  });

  bot.sendMessage(channel, msg);
});

cron.schedule("*/60 * * * *", async () => {
  const user = await User.findOne().sort({ createdAt: -1 });

  if (user) {
    bot.sendMessage(channel,
      `🎉 New user joined!\n👤 ${user.username}`
    );
  }
});
