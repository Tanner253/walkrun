# Deployment Guide - Voxel Road

This guide will help you deploy your game to Vercel.

## Quick Deploy to Vercel

### Option 1: Deploy via Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
```bash
npm i -g vercel
```

2. **Navigate to your project**:
```bash
cd walkrun
```

3. **Deploy**:
```bash
vercel
```

4. **Follow the prompts**:
   - Set up and deploy? **Y**
   - Which scope? Choose your account
   - Link to existing project? **N**
   - Project name? **walkrun** (or your choice)
   - Directory? **./**  (press Enter)
   - Override settings? **N**

5. **Deploy to production**:
```bash
vercel --prod
```

Your game will be live at: `https://walkrun-<your-username>.vercel.app`

### Option 2: Deploy via Vercel Dashboard

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit - Voxel Road game"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

2. **Go to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository

3. **Configure** (Vercel auto-detects Next.js):
   - Framework Preset: **Next.js**
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

4. **Deploy**: Click "Deploy" and wait ~2 minutes

## Post-Deployment

### Custom Domain (Optional)

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions

### Environment Variables

If you add any API keys or secrets later:
1. Go to Project Settings → Environment Variables
2. Add your variables
3. Redeploy for changes to take effect

## Troubleshooting

### Build Fails

**Issue**: `Module not found` errors

**Solution**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Iframe Not Loading

**Issue**: Game doesn't appear after deployment

**Solution**: Ensure `public/game.html` and `public/game-logic.js` exist and are committed to git.

### Local Storage Not Working

**Issue**: Save data doesn't persist

**Solution**: Check browser console for errors. Ensure you're not in private/incognito mode.

## Performance Optimization

### After Successful Deployment

1. **Enable Vercel Analytics**:
   - Go to Project Settings → Analytics
   - Enable Web Analytics

2. **Set Up Custom 404 Page** (Optional):
   - Create `pages/404.js` if needed

3. **Add SEO Meta Tags** (Optional):
   - Update `pages/_document.js` with Open Graph tags

## Local Testing Before Deploy

Always test locally first:

```bash
npm install
npm run dev
```

Visit `http://localhost:3000` and verify:
- ✅ Game loads in iframe
- ✅ All characters render
- ✅ Prize machine works
- ✅ Local storage saves/loads
- ✅ Mobile controls function
- ✅ No console errors

Then build and test production build:

```bash
npm run build
npm start
```

Visit `http://localhost:3000` again to test production build.

## Monitoring

After deployment, monitor your game:

- **Vercel Dashboard** - View deployment logs and analytics
- **Browser Console** - Check for runtime errors
- **Performance** - Use Chrome DevTools Lighthouse

## Updating Your Game

To deploy updates:

```bash
git add .
git commit -m "Update: description of changes"
git push
```

Vercel will automatically redeploy on push (if using GitHub integration).

Or with Vercel CLI:

```bash
vercel --prod
```

## Support

If you encounter issues:
1. Check Vercel deployment logs
2. Review browser console errors
3. Verify all files are committed to git
4. Test locally first with `npm run dev`

---

🎮 Happy deploying! Your game will be live and playable worldwide on Vercel's global CDN.

