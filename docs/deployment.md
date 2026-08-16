# 🚀 Deployment Guide — FereWari

## 1. Production Build & Distribution Artifacts
FereWari is compiled into an optimized static PWA distribution bundle via Vite:
- **Build Command**: `npm run build`
- **Output Directory**: `dist/`
- **Generated Assets**:
  - `dist/index.html`: Entry point with Google Fonts preconnects and responsive viewport meta tags.
  - `dist/manifest.webmanifest`: Web App Manifest (`theme_color: #03045E`, `display: standalone`, `orientation: portrait-primary`).
  - `dist/sw.js` & `dist/workbox-*.js`: Workbox PWA service worker with CacheFirst & StaleWhileRevalidate strategies.
  - `dist/assets/*.js` & `dist/assets/*.css`: Minified, tree-shaken JavaScript and CSS.

---

## 2. Supported Hosting Targets & Deploy Procedures

### 2.1 Vercel / Netlify / Cloudflare Pages
```bash
# Build
npm run build

# Deploy via Vercel CLI
npx vercel --prod

# Deploy via Netlify CLI
npx netlify deploy --prod --dir=dist
```

### 2.2 Nginx / Apache Static Server Configuration
Ensure HTTPS is active (required for Service Workers) and fallback all routes to `index.html`:
```nginx
server {
    listen 443 ssl http2;
    server_name ferewari.app;

    root /var/www/ferewari/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # PWA Service Worker caching policy
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }
}
```

---

## 3. Environment Variables
No server-side secrets or API keys are required for V1. Optional client-side variables:
```env
# Optional: Google OAuth2 Client ID for Google Drive Sync
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
```

---

## 4. Deployment Gate Status
- **Status**: **PASS**
- **Next Phase**: `15 — production-verification`
- **Blockers**: None
