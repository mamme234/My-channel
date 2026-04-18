const express = require('express');
const dotenv = require('dotenv');
const cron = require('node-cron');

dotenv.config();

const app = express();
app.use(express.json());

// import your telegram sponsor function
const postSponsor = require('./bot/sponsor');

// =========================
// 🌐 BASIC ROUTES
// =========================

app.get('/', (req, res) => {
  res.send('Crypto App Running 🚀');
});

// TEST ROUTE
app.get('/test-post', async (req, res) => {
  await postSponsor("🔥 Manual test post from API");
  res.send("Post sent 🚀");
});

// =========================
// ⏰ SCHEDULER SECTION
// =========================

// ⏰ EVERY HOUR POST
cron.schedule('0 * * * *', () => {
  console.log("⏰ Hourly post triggered");

  postSponsor(`
⏰ <b>Hourly Update</b>

🔥 Stay active and keep earning
🪙 More rewards coming soon!
  `);
});

// 📅 DAILY POST (9 AM)
cron.schedule('0 9 * * *', () => {
  console.log("📅 Daily post triggered");

  postSponsor(`
📅 <b>Daily Bonus Update</b>

🎁 Claim your daily rewards
💰 Earn more coins today
  `);
});

// 🏆 OPTIONAL: EVENING POST (9 PM)
cron.schedule('0 21 * * *', () => {
  postSponsor(`
🌙 <b>Evening Update</b>

🔥 Don’t forget to check your earnings
🚀 New rewards tomorrow!
  `);
});

// =========================
// 🚀 START SERVER
// =========================

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);

  // Optional startup post
  postSponsor("🤖 Bot started and scheduler active");
});
