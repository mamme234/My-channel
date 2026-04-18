const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

// routes
const userRoutes = require('./routes/userRoutes');
app.use('/api', userRoutes);

// home route
app.get('/', (req, res) => {
  res.send('Crypto App Running 🚀');
});

// mongo connect
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected ✅"))
  .catch(err => console.log(err));

// start server
app.listen(process.env.PORT || 10000, () => {
  console.log("Server running on port", process.env.PORT || 10000);
});
