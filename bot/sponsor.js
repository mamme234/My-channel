const bot = require('./telegramBot');

module.exports = function(message) {
  return bot.sendMessage(process.env.CHANNEL, message)
    .catch(err => console.log("Telegram error:", err.message));
};
