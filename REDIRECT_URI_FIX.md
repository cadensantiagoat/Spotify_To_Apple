# Fix: "INVALID_CLIENT: Insecure redirect URL"

This error means the redirect URI in your Spotify app settings doesn't match what your code is sending.

## Quick Fix Steps:

### 1. Check what redirect URI your server is using

When you start your server, look at the console output. You should see:
```
Using redirect URI: http://127.0.0.1:3000/api/spotify/callback
```

**Note down this EXACT URI** - it must match exactly in Spotify.

### 2. Update Spotify Dashboard

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Click on your app
3. Click **"Edit Settings"** (or the settings icon)
4. Scroll down to **"Redirect URIs"**
5. **Remove any existing redirect URIs** (click the X next to them)
6. **Add the EXACT URI** from step 1:
   ```
   http://127.0.0.1:3000/api/spotify/callback
   ```
   OR if your server shows:
   ```
   http://localhost:3000/api/spotify/callback
   ```
   Then use that one instead.

7. **Click "Add"** after typing it
8. **Click "Save"** at the bottom of the page

### 3. Verify Your .env File

Make sure your `.env` file has the SAME redirect URI:

```
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/api/spotify/callback
```

**OR** if you're using localhost:

```
SPOTIFY_REDIRECT_URI=http://localhost:3000/api/spotify/callback
```

### 4. Common Mistakes to Avoid:

❌ **Don't mix localhost and 127.0.0.1** - If your .env uses `127.0.0.1`, Spotify must use `127.0.0.1` too
❌ **Don't add trailing slashes** - `/api/spotify/callback/` is different from `/api/spotify/callback`
❌ **Don't use https://** - Use `http://` for local development
❌ **Don't forget to click "Save"** in Spotify dashboard after adding the URI

### 5. Restart Your Server

After making changes:
1. Stop server (Ctrl+C)
2. Start again: `npm start`
3. Check console for the redirect URI being used

### 6. Test Again

Try connecting to Spotify again. The error should be resolved if the URIs match exactly.

## Still Not Working?

If you're still getting the error:

1. **Check server console** - What redirect URI does it show?
2. **Check Spotify dashboard** - What redirect URI is listed there?
3. **Check .env file** - What's the SPOTIFY_REDIRECT_URI value?

All three must match EXACTLY (character for character, including http vs https, localhost vs 127.0.0.1, etc.)

## Alternative: Try Both URIs

If you're unsure, add BOTH to Spotify:
- `http://127.0.0.1:3000/api/spotify/callback`
- `http://localhost:3000/api/spotify/callback`

Then use whichever one matches your .env file.

