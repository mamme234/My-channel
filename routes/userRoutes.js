const express = require('express');
const router = express.Router();

const { earn } = require('../controllers/userController');

router.post('/earn', earn);

module.exports = router;
