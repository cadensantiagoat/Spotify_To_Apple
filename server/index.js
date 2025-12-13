const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Import routes
const spotifyRoutes = require('./routes/spotify');
const appleMusicRoutes = require('./routes/appleMusic');
const transferRoutes = require('./routes/transfer');

// API Routes
app.use('/api/spotify', spotifyRoutes);
app.use('/api/apple-music', appleMusicRoutes);
app.use('/api/transfer', transferRoutes);

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

