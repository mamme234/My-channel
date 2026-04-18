const bot = require('./telegramBot');

const CHANNEL = process.env.CHANNEL;

function sendToChannel(message) {
  bot.sendMessage(CHANNEL, message, {
    parse_mode: 'HTML'
  }).catch(err => console.log(err.message));
}

module.exports = sendToChannel;
