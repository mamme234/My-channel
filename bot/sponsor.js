const bot = require('./telegramBot');

const CHANNEL = process.env.CHANNEL;

function postToChannel(message) {
  return bot.sendMessage(CHANNEL, message, {
    parse_mode: 'HTML'
  })
  .then(() => console.log("✅ Posted"))
  .catch(err => console.log("❌ Telegram error:", err.message));
}

module.exports = postToChannel;
