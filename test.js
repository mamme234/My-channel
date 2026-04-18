require('dotenv').config();
const bot = require('./bot/telegramBot');

bot.sendMessage(process.env.CHANNEL, "🔥 BOT TEST MESSAGE WORKING");
