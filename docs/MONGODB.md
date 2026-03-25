# MongoDB Atlas Setup Guide

This guide will help you set up a free MongoDB database on MongoDB Atlas.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Click "Start Free" or "Sign Up"
3. Sign up with GitHub or Email

## Step 2: Create a Free Cluster

1. After login, click **"Build a Database"**
2. Choose **FREE Tier** (M0 Sandbox)
3. Select **AWS** as cloud provider (cheapest/free tier available)
4. Choose a region closest to your users (e.g., Mumbai/ap-south-1)
5. Click **"Create"**

## Step 3: Create Database User

1. Go to **Security** → **Database Access**
2. Click **"Add New Database User"**
3. Configure:
   - **Authentication Method:** Password
   - **Username:** `kalakariaan_admin` (or your choice)
   - **Password:** Generate a strong password (save this!)
   - **Database User Privileges:** "Read and write to any database"
4. Click **"Add User"**

## Step 4: Configure Network Access

1. Go to **Security** → **Network Access**
2. Click **"Add IP Address"**
3. For development, click **"Allow Access from Anywhere"** (0.0.0.0/0)
4. For production, add specific IPs later

## Step 5: Get Connection String

1. Go to **Deployment** → **Database**
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Select **Node.js** and copy the connection string

Your connection string will look like:
```
mongodb+srv://kalakariaan_admin:<password>@cluster0.xxxxx.mongodb.net/kalakariaan?retryWrites=true&w=majority
```

**Important:** Replace `<password>` with your actual database user password.

## Step 6: Add to Environment Variables

Add this to your `.env` file:
```env
MONGODB_URI=mongodb+srv://kalakariaan_admin:<password>@cluster0.xxxxx.mongodb.net/kalakariaan?retryWrites=true&w=majority
```

## Free Tier Limits

| Resource | Limit |
|----------|-------|
| Storage | 512 MB |
| RAM | Shared |
| Connections | 100 |
| Data Transfer | 10 GB/month |

For an MVP, this is sufficient for thousands of users.

## Troubleshooting

**Connection Timeout?**
- Check Network Access allows your IP
- Verify username/password is correct
- Ensure `<password>` in URI is URL encoded if special characters exist

**Cluster won't create?**
- Check if you already have 1 free cluster
- You may need to delete existing clusters

## Next Steps

After setup, update your Railway backend with:
1. `MONGODB_URI` - your Atlas connection string
2. `JWT_SECRET` - a secure random string (min 32 chars)

---
[Back to README](../README.md) | [Railway Backend Setup](./DEPLOYMENT.md)
