const bot = require('./telegramBot');

const CHANNEL = process.env.CHANNEL; // MUST be @gangs234

function sendToChannel(message) {
  bot.sendMessage(CHANNEL, message, {
    parse_mode: 'HTML'
  }).catch(err => {
    console.log("❌ Telegram Error:", err.response?.body || err.message);
  });
}

module.exports = sendToChannel;
