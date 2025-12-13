const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const APPLE_MUSIC_TEAM_ID = process.env.APPLE_MUSIC_TEAM_ID;
const APPLE_MUSIC_KEY_ID = process.env.APPLE_MUSIC_KEY_ID;
const APPLE_MUSIC_PRIVATE_KEY = process.env.APPLE_MUSIC_PRIVATE_KEY;

// Generate Apple Music developer token (JWT)
function generateDeveloperToken() {
  if (!APPLE_MUSIC_TEAM_ID || !APPLE_MUSIC_KEY_ID || !APPLE_MUSIC_PRIVATE_KEY) {
    return null;
  }

  try {
    // Handle private key - could be a file path or the key content itself
    let privateKey;
    if (APPLE_MUSIC_PRIVATE_KEY.includes('-----BEGIN PRIVATE KEY-----')) {
      // Key is provided as string
      privateKey = APPLE_MUSIC_PRIVATE_KEY.replace(/\\n/g, '\n');
    } else {
      // Assume it's a file path
      privateKey = fs.readFileSync(APPLE_MUSIC_PRIVATE_KEY, 'utf8');
    }

    const token = jwt.sign({}, privateKey, {
      algorithm: 'ES256',
      expiresIn: '180d',
      issuer: APPLE_MUSIC_TEAM_ID,
      header: {
        alg: 'ES256',
        kid: APPLE_MUSIC_KEY_ID
      }
    });

    return token;
  } catch (error) {
    console.error('Error generating Apple Music developer token:', error);
    return null;
  }
}

// Get Apple Music developer token
router.get('/developer-token', (req, res) => {
  const token = generateDeveloperToken();
  
  if (!token) {
    return res.status(500).json({ 
      error: 'Failed to generate developer token',
      message: 'Please check your Apple Music credentials in .env file'
    });
  }

  res.json({ 
    developerToken: token
  });
});

// Search for songs in Apple Music
router.post('/search', async (req, res) => {
  const { query, limit = 5 } = req.body;
  const developerToken = req.headers.authorization?.replace('Bearer ', '');

  if (!developerToken) {
    return res.status(401).json({ error: 'No developer token provided' });
  }

  try {
    // Note: This endpoint would require proper Apple Music API setup
    // For now, return a placeholder response
    res.json({
      results: {
        songs: {
          data: []
        }
      },
      message: 'Apple Music search requires proper API configuration'
    });
  } catch (error) {
    console.error('Error searching Apple Music:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to search Apple Music',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;

