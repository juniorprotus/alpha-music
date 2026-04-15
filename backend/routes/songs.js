const express = require('express');
const router = express.Router();
const songController = require('../controllers/songController');

// GET songs (filterable by category)
router.get('/', songController.getSongs);

// POST new song
router.post('/', songController.addSong);

module.exports = router;
