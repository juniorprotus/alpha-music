const supabase = require('../config/db');

/**
 * GET /api/videos
 * Returns the latest 12 videos ordered by date.
 */
exports.getVideos = async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('videos')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(12);

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching videos:', error.message);
        res.status(500).json({ error: 'Failed to fetch videos' });
    }
};

/**
 * POST /api/videos
 * Adds a new video to the database.
 */
exports.addVideo = async (req, res) => {
    try {
        const { title, youtube_url, thumbnail_url } = req.body;
        
        if (!title || !youtube_url || !thumbnail_url) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { data, error } = await supabase
            .from('videos')
            .insert([{ title, youtube_url, thumbnail_url }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error adding video:', error.message);
        res.status(500).json({ error: 'Failed to add video' });
    }
};
