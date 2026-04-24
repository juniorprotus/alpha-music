const express = require('express');
const router = express.Router();
const videoController = require('../controllers/videoController');

// GET latest videos
router.get('/', videoController.getVideos);

// POST new video
router.post('/', videoController.addVideo);

module.exports = router;
