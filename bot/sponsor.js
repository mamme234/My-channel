const bot = require('./telegramBot');

const CHANNEL = process.env.CHANNEL;

function postSponsor(message) {
  return bot.sendMessage(CHANNEL, message, {
    parse_mode: 'HTML'
  })
  .then(() => console.log("✅ Post sent"))
  .catch(err => console.log("❌ Error:", err.message));
}

module.exports = postSponsor;
