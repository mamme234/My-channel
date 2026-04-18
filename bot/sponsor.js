const bot = require('./telegramBot');

const CHANNEL = process.env.CHANNEL;

/**
 * Send sponsored post to channel
 * @param {string} message - sponsor message text
 */
function postSponsor(message) {
  if (!message) return;

  const formatted = `
🔥 <b>Sponsored</b>

${message}

📢 Powered by StudyBuddy Bot
  `;

  bot.sendMessage(CHANNEL, formatted, {
    parse_mode: 'HTML'
  })
  .then(() => console.log("✅ Sponsored post sent"))
  .catch(err => console.log("❌ Sponsor error:", err.message));
}

module.exports = postSponsor;
