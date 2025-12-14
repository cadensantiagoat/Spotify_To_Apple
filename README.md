# Spotify to Apple Music Transfer

A **100% FREE** web application that exports your Spotify playlists for manual import into Apple Music. No Apple Developer account required!

## Features

-  Secure OAuth authentication for Spotify
-  View all your Spotify playlists
-  Export playlists in multiple formats (CSV, JSON, Text)
-  Copy track lists to clipboard
-  Modern, responsive UI
-  **Completely Free** - No paid subscriptions needed

## Prerequisites

- Node.js (v14 or higher)
- Spotify Developer Account (free)
- **No Apple Developer Account needed!**

## Setup Instructions

### 1. Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your `Client ID` and `Client Secret`
4. Add `http://localhost:3000/api/spotify/callback` to your app's redirect URIs

### 2. Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

4. Fill in your Spotify credentials in the `.env` file:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
   ```

   **Note**: You don't need Apple Music credentials! This app exports playlists for manual import.

### 3. Run the Application

```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Usage

1. **Connect Spotify**: Click "Connect Spotify" and authorize the application
2. **Select Playlist**: Click on any playlist from your Spotify account
3. **Export**: Choose your preferred export format:
   - **CSV**: Download as spreadsheet
   - **JSON**: Download as structured data
   - **Text**: Download as plain text list
   - **Copy**: Copy track list to clipboard
4. **Import to Apple Music**: Manually create the playlist in Apple Music using the exported track list
5. **Logout**: Click "Logout" to disconnect your Spotify account and log in with a different account

See [MANUAL_IMPORT_GUIDE.md](MANUAL_IMPORT_GUIDE.md) for detailed instructions on importing to Apple Music.

### Logout Feature

To use the logout feature to switch Spotify accounts:

**Important**: You may need to disable third-party cookies in your browser settings for the logout feature to work properly. This allows Spotify to show the login screen when switching accounts.

**How to disable third-party cookies:**
- **Chrome/Edge**: Settings → Privacy and security → Cookies and other site data → Turn off "Allow third-party cookies"
- **Firefox**: Settings → Privacy & Security → Under "Cookies and Site Data", select "Block all third-party cookies"
- **Safari**: Preferences → Privacy → Uncheck "Prevent cross-site tracking"

Alternatively, you can use an incognito/private window to test account switching without changing cookie settings.

## How It Works

1. **Spotify Authentication**: Uses OAuth 2.0 to authenticate and get access to your playlists
2. **Playlist Fetching**: Retrieves all tracks from the selected Spotify playlist
3. **Export**: Exports tracks in your chosen format (CSV, JSON, or Text)
4. **Manual Import**: You manually create the playlist in Apple Music using the exported data

## Why This Approach?

-  **100% Free** - No Apple Developer account ($99/year) needed
-  **No API Limits** - No rate limiting or quota restrictions
-  **Full Control** - You decide which tracks to add
-  **Works Everywhere** - Use any Apple Music client (Mac, iPhone, iPad, Web)

The trade-off is manual import, but it's completely free and gives you full control!

## Limitations

- Manual import required (takes a bit more time)
- Not all Spotify tracks may be available in Apple Music
- You'll need to search for each track in Apple Music

## Troubleshooting

### Spotify Authentication Issues
- Verify your redirect URI matches exactly in Spotify dashboard (`http://127.0.0.1:3000/api/spotify/callback`)
- Check that your Client ID and Secret are correct in `.env` file
- Make sure you've added the redirect URI in Spotify Developer Dashboard

### Export Issues
- Make sure you've selected a playlist first
- Check browser console for any errors
- Try a different export format if one doesn't work

### Logout/Account Switching Issues
- If logout doesn't allow you to switch accounts, disable third-party cookies in your browser settings (see Usage section above)
- Alternatively, use an incognito/private window for account switching
- Clear cookies for `accounts.spotify.com` if the login screen doesn't appear

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

