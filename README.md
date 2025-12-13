# Spotify to Apple Music Transfer

A web application that allows you to transfer your Spotify playlists to Apple Music seamlessly.

## Features

- 🔐 Secure OAuth authentication for both Spotify and Apple Music
- 📋 View all your Spotify playlists
- 🎵 Transfer playlists with automatic track matching
- 📊 Progress tracking during transfer
- 🎨 Modern, responsive UI

## Prerequisites

- Node.js (v14 or higher)
- Spotify Developer Account
- Apple Developer Account (for Apple Music API access)

## Setup Instructions

### 1. Spotify API Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Note your `Client ID` and `Client Secret`
4. Add `http://localhost:3000/api/spotify/callback` to your app's redirect URIs

### 2. Apple Music API Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list)
2. Create a MusicKit identifier
3. Generate a private key for MusicKit
4. Note your `Team ID`, `Key ID`, and download the private key file
5. You'll need to generate a developer token (JWT) for authentication

### 3. Installation

1. Clone or download this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory:
   ```bash
   cp .env.example .env
   ```

4. Fill in your credentials in the `.env` file:
   ```
   SPOTIFY_CLIENT_ID=your_spotify_client_id
   SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
   SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
   
   APPLE_MUSIC_TEAM_ID=your_apple_team_id
   APPLE_MUSIC_KEY_ID=your_apple_key_id
   APPLE_MUSIC_PRIVATE_KEY=your_apple_private_key
   ```

### 4. Apple Music Developer Token

The Apple Music integration requires a developer token (JWT). You have two options:

**Option A: Generate on the server (Recommended)**
- Implement JWT generation in `server/routes/appleMusic.js` using the `jsonwebtoken` package
- Use your Team ID, Key ID, and private key to generate tokens

**Option B: Use MusicKit JS (Current Implementation)**
- The frontend uses MusicKit JS which handles authentication client-side
- You'll need to configure MusicKit with your developer token in `public/app.js`

### 5. Run the Application

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
2. **Connect Apple Music**: Click "Connect Apple Music" and sign in
3. **Select Playlist**: Click on any playlist from your Spotify account
4. **Transfer**: The app will automatically match tracks and create the playlist in Apple Music

## How It Works

1. **Spotify Authentication**: Uses OAuth 2.0 to authenticate and get access to your playlists
2. **Playlist Fetching**: Retrieves all tracks from the selected Spotify playlist
3. **Track Matching**: Searches Apple Music for each track using song name and artist
4. **Playlist Creation**: Creates a new playlist in Apple Music with all matched tracks

## Limitations

- Not all tracks may be available in Apple Music
- Track matching relies on search accuracy
- Apple Music API requires an active Apple Developer account
- Some playlists may have rate limiting restrictions

## Troubleshooting

### Spotify Authentication Issues
- Verify your redirect URI matches exactly in Spotify dashboard
- Check that your Client ID and Secret are correct

### Apple Music Issues
- Ensure you have an active Apple Developer account
- Verify your developer token is valid and not expired
- Check that MusicKit is properly configured

### Track Matching Issues
- Some tracks may not be found if they have different names or aren't available in Apple Music
- The app will transfer as many tracks as possible

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

