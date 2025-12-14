const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const router = express.Router();

const YOUTUBE_CLIENT_ID = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET;
const YOUTUBE_REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI || 'http://localhost:3000/api/youtube/callback';

// Generate random string for state
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Initiate YouTube OAuth
router.get('/login', (req, res) => {
  // Validate credentials are set
  if (!YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) {
    console.error('YouTube credentials missing! Check your .env file.');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'YouTube Client ID or Client Secret is missing. Please check your .env file.'
    });
  }

  const state = generateRandomString(16);
  const scope = 'https://www.googleapis.com/auth/youtube';

  // Log the redirect URI being used for debugging
  console.log('YouTube OAuth - Using redirect URI:', YOUTUBE_REDIRECT_URI);
  console.log('Make sure this EXACT URI is in your Google Cloud Console under "Authorized redirect URIs"!');

  const authParams = {
    client_id: YOUTUBE_CLIENT_ID,
    redirect_uri: YOUTUBE_REDIRECT_URI,
    response_type: 'code',
    scope: scope,
    state: state,
    access_type: 'offline',
    prompt: 'consent'
  };

  const queryParams = querystring.stringify(authParams);
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${queryParams}`);
});

// YouTube OAuth callback
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null || !code) {
    res.redirect('/#error=youtube_auth_failed');
    return;
  }

  try {
    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      code: code,
      client_id: YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      redirect_uri: YOUTUBE_REDIRECT_URI,
      grant_type: 'authorization_code'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Redirect to frontend with token
    res.redirect(`/#youtube_token=${access_token}&youtube_refresh=${refresh_token || ''}`);
  } catch (error) {
    console.error('Error getting YouTube token:', error.response?.data || error.message);
    res.redirect('/#error=youtube_auth_failed');
  }
});

// Search for a video on YouTube
router.get('/search', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const query = req.query.q;

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  if (!query) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: 1,
        videoCategoryId: '10' // Music category
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (response.data.items && response.data.items.length > 0) {
      const video = response.data.items[0];
      res.json({
        videoId: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.default.url
      });
    } else {
      res.json({ videoId: null, message: 'No video found' });
    }
  } catch (error) {
    console.error('Error searching YouTube:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to search YouTube',
      details: error.response?.data || error.message
    });
  }
});

// Create a YouTube playlist
router.post('/playlist', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { title, description } = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  if (!title) {
    return res.status(400).json({ error: 'Playlist title is required' });
  }

  try {
    const response = await axios.post(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        snippet: {
          title: title,
          description: description || `Playlist exported from Spotify: ${title}`
        },
        status: {
          privacyStatus: 'private'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({
      playlistId: response.data.id,
      title: response.data.snippet.title,
      url: `https://www.youtube.com/playlist?list=${response.data.id}`
    });
  } catch (error) {
    console.error('Error creating YouTube playlist:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to create playlist',
      details: error.response?.data || error.message
    });
  }
});

// Add video to playlist
router.post('/playlist/:playlistId/add', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { playlistId } = req.params;
  const { videoId } = req.body;

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  if (!videoId) {
    return res.status(400).json({ error: 'Video ID is required' });
  }

  try {
    const response = await axios.post(
      'https://www.googleapis.com/youtube/v3/playlistItems?part=snippet',
      {
        snippet: {
          playlistId: playlistId,
          resourceId: {
            kind: 'youtube#video',
            videoId: videoId
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, playlistItemId: response.data.id });
  } catch (error) {
    console.error('Error adding video to playlist:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to add video to playlist',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;
