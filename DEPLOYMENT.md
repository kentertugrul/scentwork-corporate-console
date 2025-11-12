# Deployment Guide - Scentwork Corporate Console

This guide will help you deploy your Next.js application to make it publicly visible.

## 🚀 Option 1: Vercel (Recommended - Easiest)

Vercel is made by the Next.js team and offers the simplest deployment experience.

### Steps:

1. **Create a GitHub account** (if you don't have one)
   - Go to https://github.com
   - Sign up for a free account

2. **Create a new repository on GitHub**
   - Click the "+" icon → "New repository"
   - Name it: `scentwork-corporate-console`
   - Make it **Public** (or Private if you prefer)
   - Don't initialize with README (we already have files)
   - Click "Create repository"

3. **Push your code to GitHub**
   ```bash
   cd "/Users/kentertugrul/Desktop/Scentwork Corporate"
   
   # Initialize git (if not already done)
   git init
   
   # Add all files
   git add .
   
   # Commit
   git commit -m "Initial commit - Scentwork Corporate Console"
   
   # Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
   git remote add origin https://github.com/YOUR_USERNAME/scentwork-corporate-console.git
   
   # Push to GitHub
   git branch -M main
   git push -u origin main
   ```

4. **Deploy to Vercel**
   - Go to https://vercel.com
   - Sign up with your GitHub account (free)
   - Click "Add New Project"
   - Import your `scentwork-corporate-console` repository
   - Vercel will auto-detect Next.js settings
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at: `https://scentwork-corporate-console.vercel.app`

5. **Custom Domain (Optional)**
   - In Vercel dashboard, go to your project → Settings → Domains
   - Add your custom domain if you have one

### Advantages:
- ✅ Free tier available
- ✅ Automatic deployments on every git push
- ✅ HTTPS automatically configured
- ✅ Global CDN
- ✅ Preview deployments for pull requests
- ✅ Zero configuration needed

---

## 🌐 Option 2: Netlify

### Steps:

1. **Push to GitHub** (same as Vercel steps 1-3 above)

2. **Deploy to Netlify**
   - Go to https://www.netlify.com
   - Sign up with GitHub
   - Click "Add new site" → "Import an existing project"
   - Select your GitHub repository
   - Build settings:
     - Build command: `npm run build`
     - Publish directory: `.next`
   - Click "Deploy site"
   - Your app will be live at: `https://random-name.netlify.app`

---

## 🚂 Option 3: Railway

### Steps:

1. **Push to GitHub** (same as above)

2. **Deploy to Railway**
   - Go to https://railway.app
   - Sign up with GitHub
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Next.js
   - Click "Deploy"
   - Your app will be live at: `https://your-app.railway.app`

---

## 🖥️ Option 4: Self-Hosted (VPS/Dedicated Server)

If you have a server:

```bash
# On your server
git clone https://github.com/YOUR_USERNAME/scentwork-corporate-console.git
cd scentwork-corporate-console
npm install
npm run build
npm start

# Or use PM2 for process management
npm install -g pm2
pm2 start npm --name "scentwork-console" -- start
pm2 save
pm2 startup
```

Then configure nginx or another reverse proxy to serve it.

---

## 📋 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] All files are committed to git
- [ ] `.gitignore` is set up (already done)
- [ ] No sensitive data in code (API keys, passwords, etc.)
- [ ] Build works locally: `npm run build`
- [ ] Test the production build: `npm start` (then visit http://localhost:3000)

---

## 🔧 Build Configuration

Your `package.json` already has the correct scripts:
- `npm run build` - Creates production build
- `npm start` - Runs production server
- `npm run dev` - Runs development server

Vercel/Netlify will automatically use these scripts.

---

## 🌍 Environment Variables

If you need environment variables later (for API keys, etc.):

**Vercel:**
- Project Settings → Environment Variables

**Netlify:**
- Site Settings → Environment Variables

**Local Development:**
- Create `.env.local` file (already in .gitignore)

---

## 📝 Quick Deploy Commands

### For Vercel CLI (alternative method):
```bash
npm i -g vercel
cd "/Users/kentertugrul/Desktop/Scentwork Corporate"
vercel
```

This will:
1. Ask you to login
2. Create a project
3. Deploy immediately
4. Give you a URL

---

## 🎯 Recommended Approach

**For quickest deployment:** Use Vercel CLI method above (5 minutes)

**For best long-term workflow:** Push to GitHub → Connect to Vercel (10 minutes, but better for updates)

---

## 🆘 Troubleshooting

### Build fails?
- Check that all dependencies are in `package.json`
- Run `npm run build` locally first to catch errors
- Check Vercel/Netlify build logs

### App doesn't load?
- Check that the build succeeded
- Verify all files were pushed to GitHub
- Check browser console for errors

### Need help?
- Vercel docs: https://nextjs.org/docs/deployment
- Vercel Discord: https://vercel.com/discord

---

## 🎉 After Deployment

Your app will be live and publicly accessible! Share the URL with your team or stakeholders.

**Remember:** This is a prototype with mock data. Before using in production, you'll need to:
- Replace mock data with real API calls
- Add authentication
- Set up a database
- Add security measures

See `PRODUCTION_READINESS.md` for full details.


