const bot = require('./telegramBot');
const postSponsor = require('./sponsor');

const ADMIN_ID = process.env.ADMIN_ID;

bot.onText(/\/ad (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];

  if (String(chatId) !== String(ADMIN_ID)) {
    return bot.sendMessage(chatId, "❌ Not authorized");
  }

  postSponsor(text);
  bot.sendMessage(chatId, "✅ Ad posted to channel");
});
