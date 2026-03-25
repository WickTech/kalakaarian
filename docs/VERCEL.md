# Vercel Frontend Deployment Guide

This guide will help you deploy the React frontend on Vercel.

## Prerequisites

- GitHub account
- Vercel account (sign up at [vercel.com](https://vercel.com))
- Backend deployed on Railway (see [RAILWAY.md](./RAILWAY.md))

## Step 1: Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Login"** → **"Continue with GitHub"**
3. Authorize Vercel to access your repositories

## Step 2: Import Project

1. Click **"Add New"** → **"Project"**
2. Find and select `WickTech/kalakaarian`
3. Click **"Import"**

## Step 3: Configure Project

**Framework Preset:** `Vite` (will auto-detect)

**Root Directory:** `.` (root of repository)

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Install Command:** `npm install`

## Step 4: Add Environment Variables

Click **"Environment Variables"** and add:

| Name | Value | Notes |
|------|-------|-------|
| `VITE_API_URL` | `https://your-railway-url.railway.app/api` | Your Railway backend URL |
| `VITE_APP_NAME` | `Kalakariaan` | Optional |

**Example:**
```
VITE_API_URL=https://kalakariaan-backend.railway.app/api
```

## Step 5: Deploy

1. Click **"Deploy"**
2. Watch the build progress
3. Wait for completion (usually 1-2 minutes)

## Step 6: Access Your App

After deployment, Vercel provides a URL like:
```
https://kalakariaan.vercel.app
```

Your app is now live!

## Step 7: Configure Custom Domain (Optional)

1. Go to **Settings** → **Domains**
2. Add your domain (e.g., `www.kalakariaan.com`)
3. Vercel will show DNS records to add

**For Namecheap/GoDaddy:**
- Add CNAME record pointing to `cname.vercel-dns.com`

## Step 8: Update Backend CORS

After deploying frontend, update Railway backend CORS to allow your domain:

```typescript
// In server/app.ts or cors middleware
const corsOptions = {
  origin: [
    'https://kalakariaan.vercel.app',
    'https://www.kalakariaan.com', // your custom domain
    'http://localhost:3000' // for local dev
  ],
  credentials: true
}
```

Redeploy Railway after updating.

## Auto-Deploy Setup

Vercel auto-deploys on every push to `main` branch:

1. Push code to GitHub
2. Vercel detects change
3. Auto-builds and deploys
4. New URL generated (or same if using custom domain)

## Free Tier Limits

| Feature | Limit |
|---------|-------|
| Bandwidth | 100 GB/month |
| Requests | Unlimited |
| Custom Domains | 1 |
| Serverless Functions | 100 hours/day |

For MVP, this is more than sufficient.

## Troubleshooting

**404 errors?**
- Check `vite.config.ts` has correct base path
- Ensure output directory is `dist`

**API calls failing?**
- Verify `VITE_API_URL` is correct
- Check backend CORS allows Vercel domain
- Test API URL directly in browser

**Build fails?**
- Check all dependencies in `package.json`
- Verify TypeScript has no errors locally

## Project Structure for Vercel

Vercel needs:
```
/
├── package.json
├── vite.config.ts
├── src/
└── dist/ (generated after build)
```

Make sure `vite.config.ts` has:
```typescript
export default defineConfig({
  base: './',
  build: {
    outDir: 'dist'
  }
})
```

## Performance Tips

- Vercel CDN caches static assets automatically
- Images should be optimized (next/image for Next.js)
- Enable "Speed Insights" in Vercel dashboard

## Next Steps After Deployment

1. ✅ Frontend deployed on Vercel
2. ✅ Backend deployed on Railway
3. ✅ MongoDB Atlas configured
4. Test full user flow:
   - Register as brand/influencer
   - Create campaign
   - Submit proposal
5. Set up monitoring and analytics

## Cost Summary

| Service | Monthly Cost |
|---------|-------------|
| Vercel (Frontend) | $0 |
| Railway (Backend) | $0-5 |
| MongoDB Atlas (M0) | $0 |
| Domain (optional) | $10-15/year |

**Total MVP Cost:** $0/month (within free tiers)

---
[Back to README](../README.md) | [Railway Backend Setup](./RAILWAY.md) | [MongoDB Setup](./MONGODB.md)
