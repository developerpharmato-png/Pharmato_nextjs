# Vercel Auto-Deployment Setup Guide

## Problem
Push to GitHub → No automatic deployment on Vercel

## Solution

### Step 1: Connect GitHub to Vercel
1. Go to https://vercel.com/dashboard
2. Click **"Add New..." → "Project"**
3. Click **"Import Git Repository"**
4. Select **GitHub** as your provider
5. Find and select your **Pharmato_nextjs** repository
6. Click **"Import"**

### Step 2: Configure Project Settings
1. **Framework Preset**: Select **"Next.js"**
2. **Root Directory**: Leave empty (or set to `./` if needed)
3. **Build Command**: Leave default (Next.js auto-detects)
4. **Output Directory**: Leave default
5. Click **"Deploy"**

### Step 3: Set Environment Variables on Vercel
1. Go to your project on Vercel
2. Click **Settings → Environment Variables**
3. Add all variables from your `.env.local`:
   - `MONGODB_URI`
   - `MONGODB_ADMIN_USER`
   - `MONGODB_ADMIN_PASSWORD`
   - `JWT_SECRET`
   - `NEXTAUTH_SECRET`
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - Any other sensitive variables
4. Click **"Save"**

### Step 4: Enable Auto-Deployment
1. Go to **Settings → Git**
2. Ensure **"Deploy on push to main"** is **enabled**
3. Select branch (usually `main` or `master`)
4. Click **"Save"**

### Step 5: Test Deployment
1. Make a small change to your code
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "test deployment"
   git push origin main
   ```
3. Go to Vercel Dashboard
4. You should see a new deployment starting automatically
5. Wait for it to complete (2-5 minutes)

## Verify Connection

Check your GitHub repository settings:
1. Go to GitHub repo → **Settings → Webhooks**
2. You should see a Vercel webhook
3. If not present, reconnect on Vercel

## Troubleshooting

### Deployment doesn't start
- ✓ Check "Deploy on push" is enabled in Vercel Settings
- ✓ Verify GitHub is connected (Settings → Git)
- ✓ Check branch name matches (main vs master)

### Build fails after deployment starts
- ✓ Check Vercel logs: Click failed deployment → View logs
- ✓ Verify all environment variables are set
- ✓ Check `package.json` exists and has valid dependencies

### Environment variables not working
- ✓ Environment variables must be set in Vercel, not in `.env.local`
- ✓ Redeploy after adding/changing variables
- ✓ Ensure they're set for the correct environment (Production)

## Current Project Info
- **GitHub Repo**: https://github.com/developerpharmato-png/Pharmato_nextjs/
- **Framework**: Next.js 16.0.8
- **Database**: MongoDB
- **Deployment Platform**: Vercel

## After Setup Complete
Every push to your GitHub main branch will automatically:
1. Trigger a Vercel build
2. Run tests (if configured)
3. Deploy to production
4. Show build status in GitHub PR/commit

---

**Time to setup**: ~5-10 minutes
**Automated**: Yes, all future pushes will deploy automatically
