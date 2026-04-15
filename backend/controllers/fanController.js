const supabase = require('../config/db');

/**
 * POST /api/fans
 * Submits a new fan message (Contact Form).
 */
exports.submitMessage = async (req, res) => {
    try {
        const { name, email, message } = req.body;
        
        if (!name || !email || !message) {
            return res.status(400).json({ error: 'Missing required fields: name, email, message' });
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const { data, error } = await supabase
            .from('fans')
            .insert([{ name, email, message }])
            .select();

        if (error) throw error;
        res.status(201).json({ message: 'Thank you for your message! Wax Kandle Alpha will get back to you soon.', data: data[0] });
    } catch (error) {
        console.error('Error submitting message:', error.message);
        res.status(500).json({ error: 'Failed to submit message' });
    }
};
