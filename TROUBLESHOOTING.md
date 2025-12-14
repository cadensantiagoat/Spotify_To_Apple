# Troubleshooting: INVALID_CLIENT Error

If you're getting an "INVALID_CLIENT: Invalid client" error when connecting to Spotify, follow these steps:

## Step 1: Verify Your .env File

Make sure your `.env` file exists in the root directory and contains:

```
SPOTIFY_CLIENT_ID=your_actual_client_id_here
SPOTIFY_CLIENT_SECRET=your_actual_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
```

**Important:**
- Replace `your_actual_client_id_here` and `your_actual_client_secret_here` with your real credentials from Spotify
- Do NOT include quotes around the values
- Make sure there are no extra spaces before or after the `=` sign
- The file should be named exactly `.env` (not `env.txt` or `.env.example`)

## Step 2: Get Your Spotify Credentials

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Log in with your Spotify account
3. Click on your app (or create a new one)
4. You'll see:
   - **Client ID**: Copy this to `SPOTIFY_CLIENT_ID` in your `.env` file
   - **Client Secret**: Click "Show Client Secret" and copy to `SPOTIFY_CLIENT_SECRET` in your `.env` file

## Step 3: Verify Redirect URI

1. In your Spotify app settings, go to "Edit Settings"
2. Under "Redirect URIs", make sure you have:
   ```
   http://127.0.0.1:3000/api/spotify/callback
   ```
3. Click "Add" if it's not there
4. Click "Save" at the bottom

**Important:** The redirect URI must match EXACTLY, including:
- `http://` (not `https://`)
- `127.0.0.1` (or `localhost` if you prefer)
- Port `3000`
- Path `/api/spotify/callback`

## Step 4: Restart Your Server

After updating your `.env` file:

1. Stop your server (Ctrl+C in the terminal)
2. Start it again:
   ```bash
   npm start
   ```

The server needs to be restarted to load new environment variables.

## Step 5: Verify Environment Variables Are Loaded

Check your server console when it starts. If you see errors about missing credentials, the `.env` file isn't being loaded properly.

## Common Issues

### Issue: "Client ID is missing"
- **Solution**: Make sure `SPOTIFY_CLIENT_ID` is set in your `.env` file

### Issue: "Client Secret is missing"
- **Solution**: Make sure `SPOTIFY_CLIENT_SECRET` is set in your `.env` file

### Issue: "Redirect URI mismatch"
- **Solution**: Make sure the redirect URI in Spotify dashboard matches exactly what's in your `.env` file

### Issue: Credentials look correct but still getting error
- **Solution**: 
  - Double-check for typos (no extra spaces, correct case)
  - Make sure you copied the entire Client ID and Secret (they're long strings)
  - Restart your server after making changes

## Still Having Issues?

1. Check the server console for detailed error messages
2. Verify your `.env` file is in the root directory (same folder as `package.json`)
3. Make sure you're using the correct app credentials (if you have multiple Spotify apps)
4. Try creating a new Spotify app and using those credentials

