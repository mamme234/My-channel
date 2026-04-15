const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  telegramId: String,
  coins: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 }
});

module.exports = mongoose.model("User", userSchema);
