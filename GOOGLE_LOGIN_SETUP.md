# Login with Google – Setup Guide

## 1. Google Cloud Console

You already have an OAuth client for **Clean Motion Ghana** with:
- **Authorized JavaScript origin:** `https://cleanmotion.energyprecisions.com`

For local development, add these origins in [Google Cloud Console → APIs & Services → Credentials → Your OAuth client](https://console.cloud.google.com/apis/credentials):
- `http://localhost:3000`
- `http://localhost:5173` (Vite default)

**Note:** For the credential flow (popup), you do **not** need Authorized redirect URIs.

## 2. Environment Variables

### Backend (`.env`)

```env
GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Copy the **Client ID** from your OAuth 2.0 Client in Google Cloud Console.

### Frontend

Create `frontend/.env` (or set in your build/deploy):

```env
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID.apps.googleusercontent.com
```

Use the **same** Client ID as the backend.

## 3. Where It Appears

- **User Login** (`/login/user`) – "Sign in with Google" button above "Sign in with Apple ID"
- New users are auto-created as **Customer** accounts
- Existing users with the same email can sign in with Google

## 4. Troubleshooting

| Issue | Fix |
|-------|-----|
| Button not showing | Ensure `VITE_GOOGLE_CLIENT_ID` is set and the frontend is rebuilt |
| "Invalid Google Sign-In token" | Ensure `GOOGLE_CLIENT_ID` matches in backend `.env` |
| "Not a valid origin" | Add your domain to Authorized JavaScript origins in Google Console |
