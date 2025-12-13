// Global state
let spotifyToken = null;
let currentPlaylistTracks = null;
let currentPlaylistName = null;

// Check for tokens in URL hash
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.get('spotify_token')) {
        spotifyToken = params.get('spotify_token');
        updateAuthStatus('Spotify connected!', 'success');
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

// Export button handlers
document.getElementById('exportCSV').addEventListener('click', () => exportPlaylist('csv'));
document.getElementById('exportJSON').addEventListener('click', () => exportPlaylist('json'));
document.getElementById('exportText').addEventListener('click', () => exportPlaylist('text'));
document.getElementById('copyTracks').addEventListener('click', () => copyTrackList());

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
        card.addEventListener('click', () => exportPlaylistData(playlist));
        container.appendChild(card);
    });
}

// Export Playlist Data
async function exportPlaylistData(playlist) {
    if (!spotifyToken) {
        updateAuthStatus('Please connect Spotify first.', 'error');
        return;
    }
    
    document.getElementById('exportSection').style.display = 'block';
    updateAuthStatus(`Loading "${playlist.name}"...`, 'info', 'exportStatus');
    
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
        
        currentPlaylistTracks = tracks;
        currentPlaylistName = playlist.name;
        
        updateAuthStatus(
            `Loaded ${tracks.length} tracks from "${playlist.name}". Choose an export format below.`, 
            'success', 
            'exportStatus'
        );
        document.getElementById('exportOptions').style.display = 'block';
        
        // Display track list
        displayTrackList(tracks);
    } catch (error) {
        console.error('Export error:', error);
        updateAuthStatus('Failed to load playlist. Please try again.', 'error', 'exportStatus');
    }
}

// Display Track List
function displayTrackList(tracks) {
    const container = document.getElementById('exportedTracks');
    const trackList = tracks.map((track, index) => 
        `${index + 1}. ${track.name} - ${track.artist}`
    ).join('\n');
    
    container.innerHTML = `<div class="track-list">${escapeHtml(trackList)}</div>`;
}

// Export Playlist
function exportPlaylist(format) {
    if (!currentPlaylistTracks) return;
    
    let content = '';
    let filename = `${currentPlaylistName.replace(/[^a-z0-9]/gi, '_')}.${format}`;
    let mimeType = '';
    
    switch (format) {
        case 'csv':
            content = 'Track Name,Artist,Album\n';
            content += currentPlaylistTracks.map(track => 
                `"${track.name}","${track.artist}","${track.album}"`
            ).join('\n');
            mimeType = 'text/csv';
            break;
            
        case 'json':
            content = JSON.stringify({
                playlistName: currentPlaylistName,
                tracks: currentPlaylistTracks
            }, null, 2);
            mimeType = 'application/json';
            break;
            
        case 'text':
            content = `${currentPlaylistName}\n${'='.repeat(currentPlaylistName.length)}\n\n`;
            content += currentPlaylistTracks.map((track, index) => 
                `${index + 1}. ${track.name} - ${track.artist}${track.album ? ` (${track.album})` : ''}`
            ).join('\n');
            mimeType = 'text/plain';
            break;
    }
    
    // Download file
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    updateAuthStatus(`Exported as ${format.toUpperCase()}!`, 'success', 'exportStatus');
}

// Copy Track List
function copyTrackList() {
    if (!currentPlaylistTracks) return;
    
    const trackList = currentPlaylistTracks.map((track, index) => 
        `${index + 1}. ${track.name} - ${track.artist}`
    ).join('\n');
    
    navigator.clipboard.writeText(trackList).then(() => {
        updateAuthStatus('Track list copied to clipboard!', 'success', 'exportStatus');
    }).catch(err => {
        console.error('Failed to copy:', err);
        updateAuthStatus('Failed to copy to clipboard.', 'error', 'exportStatus');
    });
}

// Update Auth Status
function updateAuthStatus(message, type, elementId = 'authStatus') {
    const statusEl = document.getElementById(elementId);
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}


// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

