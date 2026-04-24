const express = require('express');
const router = express.Router();
const fanController = require('../controllers/fanController');

// POST submit fan message
router.post('/', fanController.submitMessage);

module.exports = router;
