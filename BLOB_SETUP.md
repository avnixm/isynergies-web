# Vercel Blob Setup Guide

## Step 1: Connect Your Project to Blob Store

1. Go to your Vercel Dashboard: https://vercel.com/dashboard
2. Select your project (`isynergies-web`)
3. Go to **Storage** tab
4. Find your Blob store (`isynergies`) and click **Connect**
5. Select your project from the dropdown
6. Click **Connect**

This will automatically inject the `BLOB_READ_WRITE_TOKEN` environment variable into your Vercel project.

## Step 2: Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

Or use npx (no installation needed):
```bash
npx vercel --version
```

## Step 3: Link Your Local Project to Vercel

```bash
cd c:\Users\avnixm\Desktop\isynergies-web
vercel link
```

Follow the prompts:
- Select your Vercel account
- Select your project (`isynergies-web`)
- Confirm the project settings

## Step 4: Pull Environment Variables

```bash
vercel env pull .env.local
```

This will download all environment variables from Vercel, including `BLOB_READ_WRITE_TOKEN`.

## Step 5: Verify Setup

Check that `.env.local` contains:
```
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...
```

## Step 6: Test the Upload

1. Start your dev server: `npm run dev`
2. Go to `/admin/dashboard/hero`
3. Try uploading a video file
4. It should upload directly to Vercel Blob without 413 errors!

## Troubleshooting

### If `vercel link` doesn't work:
- Make sure you're logged in: `vercel login`
- Check you're in the project directory

### If environment variables aren't pulling:
- Make sure the project is linked: `vercel link`
- Try: `vercel env pull .env.local --yes`

### If uploads still fail:
- Check browser console for errors
- Verify `BLOB_READ_WRITE_TOKEN` is in `.env.local`
- Restart your dev server after adding the token

## Production Deployment

Once connected, the `BLOB_READ_WRITE_TOKEN` is automatically available in production. No additional setup needed!
