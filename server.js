const express = require('express');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

// import sponsor function
const postSponsor = require('./bot/sponsor');

// TEST ROUTE (THIS IS IMPORTANT)
app.get('/test-sponsor', async (req, res) => {
  await postSponsor("🔥 TEST SPONSOR MESSAGE FROM SERVER");
  res.send("Sponsor test sent 🚀");
});

app.get('/', (req, res) => {
  res.send('Crypto App Running 🚀');
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);

  // AUTO TEST ON START (optional)
  postSponsor("🔥 Bot started successfully");
});
