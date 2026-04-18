const express = require('express');
const router = express.Router();
const { earnCoins } = require('../controllers/userController');

// IMPORTANT: POST route
router.post('/earn', earnCoins);

module.exports = router;
