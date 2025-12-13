const express = require('express');
const axios = require('axios');
const router = express.Router();

// Transfer playlist from Spotify to Apple Music
router.post('/playlist', async (req, res) => {
  const { spotifyPlaylistId, spotifyToken, appleMusicToken, playlistName } = req.body;

  if (!spotifyPlaylistId || !spotifyToken) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  try {
    // Fetch Spotify playlist tracks
    const spotifyResponse = await axios.get(
      `https://api.spotify.com/v1/playlists/${spotifyPlaylistId}/tracks`,
      {
        headers: {
          'Authorization': `Bearer ${spotifyToken}`
        },
        params: {
          limit: 100,
          fields: 'items(track(name,artists(name),album(name)))'
        }
      }
    );

    const tracks = spotifyResponse.data.items
      .filter(item => item.track)
      .map(item => ({
        name: item.track.name,
        artist: item.track.artists.map(a => a.name).join(', '),
        album: item.track.album.name
      }));

    // Return tracks for frontend to handle Apple Music matching
    res.json({
      success: true,
      tracks: tracks,
      playlistName: playlistName || 'Imported Playlist',
      message: 'Tracks fetched successfully. Use MusicKit JS to create Apple Music playlist.'
    });
  } catch (error) {
    console.error('Error transferring playlist:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({ 
      error: 'Failed to transfer playlist',
      details: error.response?.data || error.message
    });
  }
});

module.exports = router;

