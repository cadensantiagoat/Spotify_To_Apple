const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const router = express.Router();

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/api/spotify/callback';

// Generate random string for state
const generateRandomString = (length) => {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

// Initiate Spotify OAuth
router.get('/login', (req, res) => {
  // Validate credentials are set
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error('Spotify credentials missing! Check your .env file.');
    return res.status(500).json({ 
      error: 'Server configuration error',
      message: 'Spotify Client ID or Client Secret is missing. Please check your .env file.'
    });
  }

  const state = generateRandomString(16);
  const scope = 'user-read-private user-read-email playlist-read-private playlist-read-collaborative';

  // Log the redirect URI being used for debugging
  console.log('Using redirect URI:', REDIRECT_URI);
  console.log('Make sure this EXACT URI is in your Spotify app settings!');

  // Check if we should force re-authentication (from query param)
  const forceLogin = req.query.force_login === 'true';
  
  console.log('Force login requested:', forceLogin);
  
  const authParams = {
    response_type: 'code',
    client_id: SPOTIFY_CLIENT_ID,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    state: state
  };
  
  // If force_login is true, add prompt to force fresh login
  if (forceLogin) {
    // Use 'login' to force re-authentication, or 'login select_account' to show account picker and force login
    authParams.prompt = 'login select_account'; // Forces fresh login and shows account selection
    console.log('Added prompt=login select_account to force re-authentication');
  }
  
  const queryParams = querystring.stringify(authParams);
  console.log('Spotify auth URL params:', queryParams);

  res.redirect(`https://accounts.spotify.com/authorize?${queryParams}`);
});

// Spotify OAuth callback
router.get('/callback', async (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;

  if (state === null) {
    res.redirect('/#error=state_mismatch');
    return;
  }

  try {
    const authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(SPOTIFY_CLIENT_ID + ':' + SPOTIFY_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: querystring.stringify({
        code: code,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code'
      })
    };

    const response = await axios(authOptions);
    const { access_token, refresh_token } = response.data;

    // Redirect to frontend with token
    res.redirect(`/#spotify_token=${access_token}&spotify_refresh=${refresh_token}`);
  } catch (error) {
    console.error('Error getting Spotify token:', error.response?.data || error.message);
    
    // Provide more specific error information
    const errorMessage = error.response?.data?.error || 'spotify_auth_failed';
    const errorDescription = error.response?.data?.error_description || error.message;
    
    console.error('Spotify auth error details:', {
      error: errorMessage,
      description: errorDescription,
      clientId: SPOTIFY_CLIENT_ID ? 'Set' : 'Missing',
      redirectUri: REDIRECT_URI
    });
    
    // Redirect with more specific error
    res.redirect(`/#error=${encodeURIComponent(errorMessage)}&details=${encodeURIComponent(errorDescription)}`);
  }
});

// Get user's playlists
router.get('/playlists', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  try {
    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        limit: 50
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching playlists:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch playlists',
      details: error.response?.data || error.message
    });
  }
});

// Get playlist tracks
router.get('/playlist/:playlistId/tracks', async (req, res) => {
  const accessToken = req.headers.authorization?.replace('Bearer ', '');
  const { playlistId } = req.params;

  if (!accessToken) {
    return res.status(401).json({ error: 'No access token provided' });
  }

  try {
    const response = await axios.get(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      params: {
        limit: 100,
        fields: 'items(track(name,artists(name),album(name)))'
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching playlist tracks:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to fetch playlist tracks',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;

