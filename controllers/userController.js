const User = require('../models/User');
const sendToChannel = require('../bot/notify');

exports.earnCoins = async (req, res) => {
  try {
    const { username, coins } = req.body;

    if (!username || !coins) {
      return res.status(400).json({ error: "Missing data" });
    }

    let user = await User.findOne({ username });

    if (!user) {
      user = new User({ username, coins });
    } else {
      user.coins += coins;
    }

    await user.save();

    // Telegram post
    sendToChannel(
      `💰 <b>Earn Update</b>\n👤 ${username}\n🪙 +${coins} coins`
    );

    res.json({ success: true, user });

  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Server error" });
  }
};
