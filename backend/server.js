require('dotenv').config();
const express = require('express');
const cors = require('cors');
const videoRoutes = require('./routes/videos');
const songRoutes = require('./routes/songs');
const fanRoutes = require('./routes/fans');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/videos', videoRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/fans', fanRoutes);

// Health Check
app.get('/', (req, res) => {
    res.json({ message: 'Wax Kandle Alpha API is running', version: '1.0.0' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
