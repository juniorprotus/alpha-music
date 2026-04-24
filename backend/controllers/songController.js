const supabase = require('../config/db');

/**
 * GET /api/songs
 * Returns latest songs with optional category filtering.
 */
exports.getSongs = async (req, res) => {
    try {
        const { category, limit = 12 } = req.query;
        let query = supabase
            .from('songs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(parseInt(limit));

        if (category) {
            query = query.eq('category', category);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.status(200).json(data);
    } catch (error) {
        console.error('Error fetching songs:', error.message);
        res.status(500).json({ error: 'Failed to fetch songs' });
    }
};

/**
 * POST /api/songs
 * Adds a new song (Single/Freestyle).
 */
exports.addSong = async (req, res) => {
    try {
        const { title, youtube_url, audio_url, thumbnail_url, category } = req.body;
        
        if (!title || !thumbnail_url || !category) {
            return res.status(400).json({ error: 'Missing required fields: title, thumbnail_url, category' });
        }

        const { data, error } = await supabase
            .from('songs')
            .insert([{ title, youtube_url, audio_url, thumbnail_url, category }])
            .select();

        if (error) throw error;
        res.status(201).json(data[0]);
    } catch (error) {
        console.error('Error adding song:', error.message);
        res.status(500).json({ error: 'Failed to add song' });
    }
};
