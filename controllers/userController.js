const User = require('../models/User');
const sendToChannel = require('../bot/notify');

exports.earnCoins = async (req, res) => {
  const { username, coins } = req.body;

  let user = await User.findOne({ username });

  if (!user) {
    user = new User({ username, coins });
  } else {
    user.coins += coins;
  }

  await user.save();

  // 🔥 Telegram auto post
  sendToChannel(
    `💰 <b>Earn Update</b>\n👤 ${username}\n🪙 +${coins} coins`
  );

  res.json({ success: true, user });
};
