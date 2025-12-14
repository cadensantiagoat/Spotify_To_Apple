// Global state
let spotifyToken = null;
let currentPlaylistTracks = null;
let currentPlaylistName = null;

// Check if force re-auth is needed (persisted in sessionStorage)
function getForceReauth() {
    return sessionStorage.getItem('forceReauth') === 'true';
}

function setForceReauth(value) {
    if (value) {
        sessionStorage.setItem('forceReauth', 'true');
    } else {
        sessionStorage.removeItem('forceReauth');
    }
}

// Check for tokens in URL hash
window.addEventListener('DOMContentLoaded', () => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    
    if (params.get('spotify_token')) {
        spotifyToken = params.get('spotify_token');
        setForceReauth(false); // Reset flag after successful login
        updateAuthStatus('Spotify connected!', 'success');
        showLogoutButton();
        loadSpotifyPlaylists();
    }
    
    // If there's an error, reset forceReauth flag
    if (params.get('error')) {
        setForceReauth(false);
        updateAuthStatus('Authentication failed. Please try again.', 'error');
    }
    
    // Clear hash
    window.location.hash = '';
    
    // Set up export button handlers
    const exportCSV = document.getElementById('exportCSV');
    const exportJSON = document.getElementById('exportJSON');
    const exportText = document.getElementById('exportText');
    const copyTracks = document.getElementById('copyTracks');
    
    if (exportCSV) exportCSV.addEventListener('click', () => exportPlaylist('csv'));
    if (exportJSON) exportJSON.addEventListener('click', () => exportPlaylist('json'));
    if (exportText) exportText.addEventListener('click', () => exportPlaylist('text'));
    if (copyTracks) copyTracks.addEventListener('click', () => copyTrackList());
});

// Spotify Login
const spotifyLoginBtn = document.getElementById('spotifyLogin');
if (spotifyLoginBtn) {
    spotifyLoginBtn.addEventListener('click', () => {
        // If forceReauth flag is set (after logout), force re-authentication
        if (getForceReauth()) {
            console.log('Force re-authentication: redirecting with force_login=true');
            window.location.href = '/api/spotify/login?force_login=true';
        } else {
            window.location.href = '/api/spotify/login';
        }
    });
}

// Spotify Logout
const spotifyLogoutBtn = document.getElementById('spotifyLogout');
if (spotifyLogoutBtn) {
    spotifyLogoutBtn.addEventListener('click', () => {
        logoutSpotify();
    });
}

// Logout function
function logoutSpotify() {
    // Clear token
    spotifyToken = null;
    currentPlaylistTracks = null;
    currentPlaylistName = null;
    
    // Set flag to force re-authentication on next login
    setForceReauth(true);
    
    // Clear any stored data
    localStorage.removeItem('spotify_token');
    sessionStorage.removeItem('spotify_token');
    
    // Hide playlists and export sections
    const playlistsSection = document.getElementById('playlistsSection');
    const exportSection = document.getElementById('exportSection');
    if (playlistsSection) playlistsSection.style.display = 'none';
    if (exportSection) exportSection.style.display = 'none';
    
    // Clear playlist list
    const playlistsList = document.getElementById('playlistsList');
    if (playlistsList) playlistsList.innerHTML = '';
    
    // Clear URL hash
    window.location.hash = '';
    
    // Reset UI
    updateAuthStatus('Logged out. Connect Spotify to continue.', 'info');
    hideLogoutButton();
}

// Show logout button
function showLogoutButton() {
    const logoutBtn = document.getElementById('spotifyLogout');
    const loginBtn = document.getElementById('spotifyLogin');
    if (logoutBtn) logoutBtn.style.display = 'inline-flex';
    if (loginBtn) loginBtn.style.display = 'none';
}

// Hide logout button
function hideLogoutButton() {
    const logoutBtn = document.getElementById('spotifyLogout');
    const loginBtn = document.getElementById('spotifyLogin');
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = 'inline-flex';
}

// Load Spotify Playlists
async function loadSpotifyPlaylists() {
    if (!spotifyToken) {
        console.error('No Spotify token available');
        return;
    }
    
    try {
        console.log('Fetching playlists...');
        const response = await fetch('/api/spotify/playlists', {
            headers: {
                'Authorization': `Bearer ${spotifyToken}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('Failed to fetch playlists:', response.status, errorData);
            throw new Error(`Failed to fetch playlists: ${response.status} ${errorData.error || ''}`);
        }
        
        const data = await response.json();
        console.log('Playlists loaded:', data.items?.length || 0, 'playlists');
        
        if (!data.items || data.items.length === 0) {
            updateAuthStatus('No playlists found. Create a playlist in Spotify first.', 'info');
            const playlistsSection = document.getElementById('playlistsSection');
            const playlistsList = document.getElementById('playlistsList');
            if (playlistsSection) playlistsSection.style.display = 'block';
            if (playlistsList) playlistsList.innerHTML = '<p>No playlists found. Create a playlist in Spotify and try again.</p>';
            return;
        }
        
        displayPlaylists(data.items);
        const playlistsSection = document.getElementById('playlistsSection');
        if (playlistsSection) playlistsSection.style.display = 'block';
    } catch (error) {
        console.error('Error loading playlists:', error);
        updateAuthStatus(`Failed to load playlists: ${error.message}. Please check the browser console (F12) for details.`, 'error');
    }
}

// Display Playlists
function displayPlaylists(playlists) {
    const container = document.getElementById('playlistsList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (playlists.length === 0) {
        container.innerHTML = '<p>No playlists found.</p>';
        return;
    }
    
    playlists.forEach(playlist => {
        const card = document.createElement('div');
        card.className = 'playlist-card';
        
        // Get playlist cover image (use first image or a placeholder)
        const coverImage = playlist.images && playlist.images.length > 0 
            ? playlist.images[0].url 
            : 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300"%3E%3Crect fill="%23667eea" width="300" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="48"%3E%F0%9F%8E%B6%3C/text%3E%3C/svg%3E';
        
        card.innerHTML = `
            <div class="playlist-cover">
                <img src="${coverImage}" alt="${escapeHtml(playlist.name)} cover" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'300\' height=\'300\'%3E%3Crect fill=\'%23667eea\' width=\'300\' height=\'300\'/%3E%3Ctext x=\'50%25\' y=\'50%25\' text-anchor=\'middle\' dy=\'.3em\' fill=\'white\' font-family=\'Arial\' font-size=\'48\'%3E%F0%9F%8E%B6%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="playlist-info">
                <h3>${escapeHtml(playlist.name)}</h3>
                <p>${playlist.tracks.total} tracks</p>
            </div>
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
    
    // Hide export options immediately to prevent exporting stale data
    const exportOptions = document.getElementById('exportOptions');
    if (exportOptions) {
        exportOptions.style.display = 'none';
    }
    
    const exportSection = document.getElementById('exportSection');
    if (exportSection) {
        exportSection.style.display = 'block';
        // Scroll to export section so user can see it
        exportSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    updateAuthStatus(`Loading "${playlist.name}"...`, 'info', 'exportStatus');
    
    try {
        const response = await fetch(`/api/spotify/playlist/${playlist.id}/tracks`, {
            headers: {
                'Authorization': `Bearer ${spotifyToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Failed to fetch playlist tracks');
        }
        
        const data = await response.json();
        console.log('Track data sample:', data.items[0]); // Debug log
        
        const tracks = data.items.filter(item => item.track).map(item => {
            const albumImages = item.track.album?.images || [];
            const albumCover = albumImages.length > 0 ? albumImages[0].url : null;
            
            // Debug log for first few tracks
            if (data.items.indexOf(item) < 3) {
                console.log('Track:', item.track.name, 'Album images:', albumImages, 'Cover URL:', albumCover);
            }
            
            return {
                name: item.track.name,
                artist: item.track.artists.map(a => a.name).join(', '),
                album: item.track.album?.name || '',
                albumCover: albumCover
            };
        });
        
        currentPlaylistTracks = tracks;
        currentPlaylistName = playlist.name;
        
        updateAuthStatus(
            `Loaded ${tracks.length} tracks from "${playlist.name}". Choose an export format below.`, 
            'success', 
            'exportStatus'
        );
        
        // Only show export options after data is loaded
        if (exportOptions) {
            exportOptions.style.display = 'block';
        }
        
        displayTrackList(tracks);
    } catch (error) {
        console.error('Export error:', error);
        updateAuthStatus('Failed to load playlist. Please try again.', 'error', 'exportStatus');
    }
}

// Handle image load errors
function handleImageError(img) {
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23667eea" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="24"%3E%F0%9F%8E%B6%3C/text%3E%3C/svg%3E';
    img.src = placeholder;
    img.onerror = null; // Prevent infinite loop
}

// Display Track List
function displayTrackList(tracks) {
    const container = document.getElementById('exportedTracks');
    if (!container) return;
    
    const placeholderImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64"%3E%3Crect fill="%23667eea" width="64" height="64"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="white" font-family="Arial" font-size="24"%3E%F0%9F%8E%B6%3C/text%3E%3C/svg%3E';
    
    container.innerHTML = '<div class="track-list"></div>';
    const trackListContainer = container.querySelector('.track-list');
    
    tracks.forEach((track, index) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        
        const coverImage = track.albumCover || placeholderImage;
        const img = document.createElement('img');
        img.src = coverImage;
        img.alt = track.album || 'Album';
        img.className = 'track-cover';
        img.onerror = () => handleImageError(img);
        
        const trackDetails = document.createElement('div');
        trackDetails.className = 'track-details';
        
        const trackNumber = document.createElement('div');
        trackNumber.className = 'track-number';
        trackNumber.textContent = index + 1;
        
        const trackInfo = document.createElement('div');
        trackInfo.className = 'track-info';
        
        const trackName = document.createElement('div');
        trackName.className = 'track-name';
        trackName.textContent = track.name;
        
        const trackArtist = document.createElement('div');
        trackArtist.className = 'track-artist';
        trackArtist.textContent = track.artist;
        
        trackInfo.appendChild(trackName);
        trackInfo.appendChild(trackArtist);
        
        if (track.album) {
            const trackAlbum = document.createElement('div');
            trackAlbum.className = 'track-album';
            trackAlbum.textContent = track.album;
            trackInfo.appendChild(trackAlbum);
        }
        
        trackDetails.appendChild(trackNumber);
        trackDetails.appendChild(trackInfo);
        
        trackItem.appendChild(img);
        trackItem.appendChild(trackDetails);
        
        trackListContainer.appendChild(trackItem);
    });
}

// Escape CSV value according to RFC 4180
function escapeCsvValue(value) {
    if (value === null || value === undefined) {
        return '""';
    }
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
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
                `${escapeCsvValue(track.name)},${escapeCsvValue(track.artist)},${escapeCsvValue(track.album)}`
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
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.className = `status ${type}`;
}

// Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
