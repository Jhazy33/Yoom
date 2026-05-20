# R2 Environment Variables Setup Guide

## ⚠️ Current Issue
Uploads failing because R2 credentials aren't configured in Vercel deployment.

## 🔧 Fix: Add Environment Variables to Vercel

### Step 1: Go to Vercel Dashboard
Navigate to: https://vercel.com/jhazy333-projects/yoom/settings/environment-variables

### Step 2: Add Required Environment Variables

Add these exact variables from your `.env.local`:

```bash
R2_ACCOUNT_ID=5468d525633e2667a6f0f38558552a40
R2_ACCESS_KEY_ID=ee09ac5e0bbb18247381b679daa90914
R2_SECRET_ACCESS_KEY=64d7f9e534909ad85dad63eb13fcc54afa5b09d0d125d863f296dde7ddddbb61
R2_BUCKET_NAME=cih-consultingllc
R2_PUBLIC_URL=https://pub-3cf940677b264b218ab35675abf5d7d9.r2.dev
```

### Step 3: Deploy
After adding variables, Vercel will auto-redeploy or you can trigger manual deploy.

## 🧪 Verify Setup

After deployment, test recording upload. If still failing, check browser console for specific error messages.

## 📝 Local Development

Your `.env.local` already has these variables, so local development should work fine. This issue is deployment-specific.