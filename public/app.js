// Global state
let spotifyToken = null;
let appleMusicToken = null;
let musicKit = null;

// Check for tokens in URL hash
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.get('spotify_token')) {
        spotifyToken = params.get('spotify_token');
        updateAuthStatus('Spotify connected!', 'success');
        document.getElementById('appleMusicLogin').disabled = false;
        loadSpotifyPlaylists();
    }
    
    if (params.get('error')) {
        updateAuthStatus('Authentication failed. Please try again.', 'error');
    }
    
    // Clear hash
    window.location.hash = '';
});

// Spotify Login
document.getElementById('spotifyLogin').addEventListener('click', () => {
    window.location.href = '/api/spotify/login';
});

// Apple Music Login
document.getElementById('appleMusicLogin').addEventListener('click', async () => {
    try {
        // Fetch developer token from server
        const tokenResponse = await fetch('/api/apple-music/developer-token');
        if (!tokenResponse.ok) {
            throw new Error('Failed to get developer token');
        }
        
        const { developerToken } = await tokenResponse.json();
        
        if (!developerToken) {
            throw new Error('Developer token not available. Please configure Apple Music credentials.');
        }
        
        // Initialize MusicKit
        musicKit = await window.MusicKit.configure({
            developerToken: developerToken,
            app: {
                name: 'Spotify to Apple Music',
                build: '1.0.0'
            }
        });
        
        // Request authorization
        const userToken = await musicKit.authorize();
        appleMusicToken = userToken;
        
        updateAuthStatus('Apple Music connected!', 'success');
        document.getElementById('appleMusicLogin').disabled = true;
    } catch (error) {
        console.error('Apple Music auth error:', error);
        updateAuthStatus(
            'Apple Music authentication failed. Please check your Apple Music credentials in the .env file.', 
            'error'
        );
    }
});

// Load Spotify Playlists
async function loadSpotifyPlaylists() {
    if (!spotifyToken) return;
    
    try {
        const response = await fetch('/api/spotify/playlists', {
            headers: {
                'Authorization': `Bearer ${spotifyToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch playlists');
        }
        
        const data = await response.json();
        displayPlaylists(data.items);
        document.getElementById('playlistsSection').style.display = 'block';
    } catch (error) {
        console.error('Error loading playlists:', error);
        updateAuthStatus('Failed to load playlists. Please reconnect Spotify.', 'error');
    }
}

// Display Playlists
function displayPlaylists(playlists) {
    const container = document.getElementById('playlistsList');
    container.innerHTML = '';
    
    if (playlists.length === 0) {
        container.innerHTML = '<p>No playlists found.</p>';
        return;
    }
    
    playlists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        card.innerHTML = `
            <h3>${escapeHtml(playlist.name)}</h3>
            <p>${playlist.tracks.total} tracks</p>
        `;
        card.addEventListener('click', () => transferPlaylist(playlist));
        container.appendChild(card);
    });
}

// Transfer Playlist
async function transferPlaylist(playlist) {
    if (!spotifyToken) {
        updateAuthStatus('Please connect Spotify first.', 'error');
        return;
    }
    
    if (!appleMusicToken && !musicKit) {
        updateAuthStatus('Please connect Apple Music first.', 'error');
        return;
    }
    
    document.getElementById('transferSection').style.display = 'block';
    updateAuthStatus(`Transferring "${playlist.name}"...`, 'info', 'transferStatus');
    
    try {
        // Fetch playlist tracks
        const response = await fetch(`/api/spotify/playlist/${playlist.id}/tracks`, {
            headers: {
                'Authorization': `Bearer ${spotifyToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch playlist tracks');
        }
        
        const data = await response.json();
        const tracks = data.items.filter(item => item.track).map(item => ({
            name: item.track.name,
            artist: item.track.artists.map(a => a.name).join(', '),
            album: item.track.album.name
        }));
        
        // Show progress
        document.getElementById('transferProgress').style.display = 'block';
        
        // Search and match tracks in Apple Music
        const matchedTracks = [];
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            const progress = ((i + 1) / tracks.length) * 100;
            updateProgress(progress);
            
            try {
                const searchQuery = `${track.name} ${track.artist}`;
                const searchResults = await musicKit.api.search(searchQuery, {
                    types: ['songs'],
                    limit: 1
                });
                
                if (searchResults.songs && searchResults.songs.data.length > 0) {
                    matchedTracks.push(searchResults.songs.data[0].id);
                }
            } catch (error) {
                console.error(`Failed to match track: ${track.name}`, error);
            }
        }
        
        // Create Apple Music playlist
        if (matchedTracks.length > 0) {
            const playlistResponse = await musicKit.api.createPlaylist(playlist.name, {
                description: `Imported from Spotify - ${matchedTracks.length} tracks`
            });
            
            // Add tracks to playlist
            await musicKit.api.addToPlaylist(playlistResponse.data[0].id, matchedTracks);
            
            updateAuthStatus(
                `Successfully transferred ${matchedTracks.length} of ${tracks.length} tracks!`, 
                'success', 
                'transferStatus'
            );
        } else {
            updateAuthStatus('No tracks could be matched in Apple Music.', 'error', 'transferStatus');
        }
        
        document.getElementById('transferProgress').style.display = 'none';
    } catch (error) {
        console.error('Transfer error:', error);
        updateAuthStatus('Transfer failed. Please try again.', 'error', 'transferStatus');
        document.getElementById('transferProgress').style.display = 'none';
    }
}

// Update Auth Status
function updateAuthStatus(message, type, elementId = 'authStatus') {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Update Progress
function updateProgress(percent) {
    const progressFill = document.getElementById('progressFill');
    progressFill.style.width = `${percent}%`;
    progressFill.textContent = `${Math.round(percent)}%`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
