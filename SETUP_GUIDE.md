# Setup Guide: Handling Spotify Redirect URI

## Problem
Spotify requires HTTPS redirect URIs, but `http://localhost:3000` is not secure.

## Solution: Use ngrok (Recommended)

### Step 1: Install ngrok

1. Download ngrok from https://ngrok.com/download
2. Extract the ngrok.exe file to a folder (e.g., `C:\ngrok\`)
3. (Optional) Add ngrok to your PATH for easier access

### Step 2: Start your application

```bash
npm start
```

Your app should be running on `http://localhost:3000`

### Step 3: Start ngrok tunnel

Open a new terminal/command prompt and run:

```bash
ngrok http 3000
```

This will give you an HTTPS URL like: `https://abc123.ngrok.io`

### Step 4: Update Spotify App Settings

1. Go to your Spotify Developer Dashboard
2. Edit your app
3. Add the redirect URI: `https://abc123.ngrok.io/api/spotify/callback`
   (Replace `abc123.ngrok.io` with your actual ngrok URL)

### Step 5: Update your .env file

Update the `SPOTIFY_REDIRECT_URI` in your `.env` file:

```
SPOTIFY_REDIRECT_URI=https://abc123.ngrok.io/api/spotify/callback
```

**Important:** Every time you restart ngrok, you'll get a new URL (unless you have a paid account with a static domain). You'll need to update both Spotify and your `.env` file with the new URL.

## Alternative: Use localhost with specific format

Some users report that Spotify accepts:
- `http://localhost:3000/api/spotify/callback`
- `http://127.0.0.1:3000/api/spotify/callback`

Try these first before using ngrok. If they don't work, use the ngrok solution above.

## Alternative: Use a development domain

If you have a domain, you can:
1. Set up a subdomain (e.g., `dev.yourdomain.com`)
2. Point it to your local machine
3. Use `https://dev.yourdomain.com/api/spotify/callback`

This requires SSL certificate setup (Let's Encrypt works well for this).

