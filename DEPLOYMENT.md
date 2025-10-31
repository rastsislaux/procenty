# Deployment Instructions

This project is configured to automatically deploy to GitHub Pages using GitHub Actions.

## Setup

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Under "Source", select "GitHub Actions"

2. **Configure Custom Domain**:
   - In repository Settings → Pages → Custom domain
   - Enter: `procenty.rastsislaux.xyz`
   - Check "Enforce HTTPS"
   
3. **DNS Configuration**:
   - Add a CNAME record pointing `procenty.rastsislaux.xyz` to your GitHub Pages domain (usually `username.github.io`)
   - Or add A records pointing to GitHub Pages IP addresses:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153

4. **Deployment**:
   - The site will automatically deploy on every push to the `master` branch
   - You can also manually trigger deployment via Actions tab → "Deploy to GitHub Pages" → "Run workflow"

The CNAME file is automatically included in the build output from the `public/` directory.

