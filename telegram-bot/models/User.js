const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  userId: String,
  username: String,
  coins: { type: Number, default: 0 },
  referrals: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
