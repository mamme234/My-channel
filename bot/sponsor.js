const bot = require('./bot/telegramBot');

const CHANNEL = process.env.CHANNEL;

function postToChannel(message) {
  return bot.sendMessage(CHANNEL, message, {
    parse_mode: 'HTML'
  })
  .then(() => console.log("✅ Posted"))
  .catch(err => console.log("❌ Error:", err.message));
}

module.exports = postToChannel;
