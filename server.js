const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

const BOT_TOKEN = "8344006616:AAFtsVrXi8xRAtbyWHeMxsXk_X3ntE3xRMk";
const CHAT_ID = "@gangs234";

// send message to Telegram channel
async function sendToChannel(text) {
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            chat_id: CHAT_ID,
            text: text,
            parse_mode: "Markdown"
        })
    });
}

// API endpoint
app.post('/post', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.json({ success: false, error: "No message" });
    }

    try {
        await sendToChannel(message);
        res.json({ success: true });
    } catch (err) {
        res.json({ success: false, error: err.message });
    }
});

app.get('/', (req, res) => {
    res.send("🚀 Venoms server running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Running on port " + PORT));
