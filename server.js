const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const TelegramBot = require("node-telegram-bot-api");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// ================= BOT =================
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// ================= START (UPDATED) =================
bot.onText(/\/start(.*)/, async (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId,
    `👋 Welcome!\n\n💰 Tap to earn coins\n🚀 Invite friends for bonus`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: "🔥 Open App",
              web_app: {
                url: "https://myapp1-khaki.vercel.app"
              }
            }
          ]
        ]
      }
    }
  );
});

// ================= BALANCE =================
bot.onText(/\/balance/, (msg) => {
  bot.sendMessage(msg.chat.id, "💰 Your balance feature will be added with DB soon.");
});

// ================= MONGODB =================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log("Mongo Error ❌", err));

// ================= HOME ROUTE =================
app.get("/", (req, res) => {
  res.send("Crypto Bot Running 🚀");
});

// ================= SERVER =================
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
