const bot = require('./telegramBot');

function postToChannel(message) {
  return bot.sendMessage(process.env.CHANNEL, message)
    .then(() => console.log("✅ Posted to channel"))
    .catch(err => console.log("❌ Telegram error:", err.message));
}

module.exports = postToChannel;
