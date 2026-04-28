const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: String,
  coins: { type: Number, default: 0 },
  lastTap: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);
