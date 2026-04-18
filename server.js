const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

dotenv.config();
connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', require('./routes/userRoutes'));

app.get('/', (req, res) => {
  res.send('Crypto App Running 🚀');
});

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});
