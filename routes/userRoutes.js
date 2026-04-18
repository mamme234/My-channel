const express = require('express');
const router = express.Router();
const { earnCoins } = require('../controllers/userController');

router.post('/earn', earnCoins);

module.exports = router;
