# Railway Backend Deployment Guide

This guide will help you deploy the Express backend on Railway.

## Prerequisites

- GitHub account connected to Railway
- MongoDB Atlas cluster created (see [MONGODB.md](./MONGODB.md))
- Railway account (sign up at [railway.app](https://railway.app))

## Step 1: Connect GitHub to Railway

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** → **"Login with GitHub"**
3. Authorize Railway to access your repositories
4. Select `WickTech/kalakaarian`

## Step 2: Create New Project

1. Click **"New Project"** → **"Deploy from GitHub repo"**
2. Select `kalakariaan` repository
3. Railway will detect it's a Node.js project

## Step 3: Configure Build Settings

Railway will auto-detect settings, but verify:

**Root Directory:** `./server`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

## Step 4: Add Environment Variables

1. Go to **Variables** tab
2. Add these variables:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kalakariaan?retryWrites=true&w=majority
JWT_SECRET=your-super-secure-32-char-secret-key-here
```

**Generate a secure JWT_SECRET:**
```bash
openssl rand -base64 32
```

## Step 5: Configure Service Port

1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** to get a public URL
3. Note your URL: `https://xxxxx.railway.app`

**Important:** Set:
```
PORT=5000
```

Railway will automatically route external traffic to this port.

## Step 6: Deploy

1. Click **"Deploy"** 
2. Watch the build logs
3. Wait for "Deployed" status

## Step 7: Test Your API

Your API is now live at:
```
https://xxxxx.railway.app
```

Test endpoints:
```
GET https://xxxxx.railway.app/api/health
POST https://xxxxx.railway.app/api/auth/register
POST https://xxxxx.railway.app/api/auth/login
```

## Connecting to Frontend

After deployment, update your Vercel frontend environment variable:
```
VITE_API_URL=https://xxxxx.railway.app/api
```

## Custom Domain (Optional)

1. Go to **Settings** → **Networking**
2. Click **"Custom Domain"**
3. Add your domain (e.g., `api.kalakariaan.com`)
4. Configure DNS records as shown

## Monitoring & Logs

- **Logs:** View in Railway dashboard under **Deployments**
- **Metrics:** CPU, Memory, Network usage available
- **Restart:** Click **"Redeploy"** to restart

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Projects | 1 |
|带宽 | 100 GB/month |
| CPU | 0.5 vCPU (shared) |
| RAM | 512 MB |
| Execution Time | 500 hours/month |

## Troubleshooting

**Build fails?**
- Check `package.json` scripts are correct
- Verify all dependencies are listed

**Can't connect to MongoDB?**
- Check `MONGODB_URI` is correct
- Verify MongoDB Atlas IP whitelist allows Railway IPs

**CORS errors?**
- Update backend CORS configuration to allow your frontend domain

## Cost Management

Railway charges based on usage. For MVP:
- Stay under free tier limits
- Monitor usage in dashboard
- Set budget alerts in Project Settings

---
[Back to README](../README.md) | [Vercel Frontend Setup](./VERCEL.md) | [MongoDB Setup](./MONGODB.md)
