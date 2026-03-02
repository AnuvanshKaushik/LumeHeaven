# LUMEHEAVEN Deployment Guide

## Recommended stack
- Frontend: Vercel (`client`)
- Backend API: Render (`server`)
- Database: MongoDB Atlas
- Custom domains:
  - `www.yourdomain.com` -> frontend
  - `api.yourdomain.com` -> backend

## 1) Prepare and secure credentials
Rotate any secrets that were ever shared publicly.

Create fresh values for:
- `JWT_SECRET`
- `SESSION_SECRET`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_PASS` (Google app password)

## 2) Deploy backend to Render
1. Push this repo to GitHub.
2. In Render, create a new **Web Service** from this repo.
3. Use:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Set environment variables:
   - `MONGO_URI`
   - `JWT_SECRET`
   - `CLIENT_URL` (set later to your frontend URL)
   - `SESSION_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL` (set later to backend domain)
   - `EMAIL_HOST`
   - `EMAIL_PORT`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - `EMAIL_FROM`
   - `DEFAULT_MANAGER_EMAIL`
   - `DEFAULT_MANAGER_PASSWORD`
   - `DEFAULT_MANAGER_NAME`
5. Deploy and copy your backend URL (example: `https://lumeheaven-api.onrender.com`).

## 3) Deploy frontend to Vercel
1. In Vercel, import the same repo.
2. Configure:
   - Root Directory: `client`
   - Framework Preset: `Vite`
3. Set environment variable:
   - `VITE_API_BASE_URL=https://<your-backend-domain>/api`
4. Deploy and copy your frontend URL (example: `https://lumeheaven.vercel.app`).

## 4) Wire OAuth + CORS after deploy
Update backend environment variables:
- `CLIENT_URL=https://<your-frontend-domain>`
- `GOOGLE_CALLBACK_URL=https://<your-backend-domain>/auth/google/callback`

In Google Cloud OAuth client settings:
- Authorized JavaScript origin:
  - `https://<your-frontend-domain>`
- Authorized redirect URI:
  - `https://<your-backend-domain>/auth/google/callback`

Redeploy backend after these changes.

## 5) Add custom domains
### Frontend
Attach `www.yourdomain.com` in Vercel.

### Backend
Attach `api.yourdomain.com` in Render.

Create DNS records at your domain provider:
- `CNAME www -> <vercel-target>`
- `CNAME api -> <render-target>`
- Optional: apex redirect (`yourdomain.com` -> `www.yourdomain.com`)

## 6) Production checks
1. `GET https://api.yourdomain.com/api/health`
2. Customer login/register
3. Google login
4. Newsletter subscribe email
5. Order placement email
6. Product image upload

## Important note about product images
Current upload flow saves files to local server storage (`server/uploads`). Many cloud platforms have ephemeral storage, so images can disappear after redeploy/restart. For production, move uploads to S3 or Cloudinary.
