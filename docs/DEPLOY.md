# Deployment Guide

Lua is a static PWA — no server required. Deploy the `dist/` folder anywhere that serves static files.

## GitHub Pages (Default)

### Prerequisites
- Node.js 20+
- npm
- `gh-pages` package (installed globally or via npx)

### Steps

```bash
# 1. Install dependencies
npm install

# 2. Build
npm run build

# 3. Deploy to gh-pages branch
npx gh-pages -d dist
```

The app will be available at `https://<username>.github.io/lua-period-tracker/`.

### Automation

The `vite.config.ts` has `base: '/lua-period-tracker/'` which matches the GitHub Pages subpath. If your repo has a different name, update `base` in `vite.config.ts` and `start_url`/`scope` in `public/manifest.json`.

### Custom Domain on GitHub Pages

1. Add a `CNAME` file to `public/` with your domain (e.g., `lua.example.com`)
2. Set `base: '/'` in `vite.config.ts`
3. Update `start_url` and `scope` to `/` in `public/manifest.json`
4. Configure DNS: CNAME record pointing to `<username>.github.io`
5. Enable HTTPS in repo Settings → Pages

---

## Self-Hosting on a VPS

### Prerequisites
- VPS with Ubuntu/Debian (any Linux works)
- nginx
- Node.js 20+ (for building — not needed at runtime)
- Domain name with DNS pointing to VPS IP

### 1. Build Locally

```bash
# Edit vite.config.ts: set base to '/'
# Edit public/manifest.json: set start_url and scope to '/'

npm install
npm run build
```

### 2. Upload to VPS

```bash
# Create target directory on VPS
ssh user@your-server "mkdir -p /opt/lua/dist"

# Upload built files
rsync -avz --delete dist/ user@your-server:/opt/lua/dist/
```

### 3. Configure nginx

```nginx
server {
    listen 80;
    server_name lua.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name lua.example.com;

    # SSL certificates (use certbot for Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/lua.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lua.example.com/privkey.pem;

    root /opt/lua/dist;
    index index.html;

    # SPA fallback: all routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets aggressively (Vite hashes filenames)
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service worker must not be cached
    location /sw.js {
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

### 4. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d lua.example.com
```

Certbot auto-renews via systemd timer.

### 5. Google Drive Sync (Optional)

If you want cloud backup via Google Drive:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project, enable Google Drive API
3. Create OAuth 2.0 Client ID (Web application)
4. Add your domain to Authorized JavaScript origins
5. Set `VITE_GOOGLE_CLIENT_ID` in `.env` before building

### 6. Verify

```bash
curl -I https://lua.example.com
# Should return 200 with correct headers

# Test PWA manifest
curl https://lua.example.com/manifest.json
```

Visit the site in Safari/Chrome. The service worker should register automatically. On iOS: Share → Add to Home Screen.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_GOOGLE_CLIENT_ID` | No | Google OAuth client ID for Drive backup |
| `VITE_ICE_SERVERS` | No | Not used (reserved for future) |

These are build-time variables — set them before `npm run build`.

---

## Updating

```bash
# Pull latest code
git pull

# Rebuild
npm run build

# Redeploy
npx gh-pages -d dist          # GitHub Pages
# or
rsync -avz --delete dist/ user@server:/opt/lua/dist/  # VPS
```

The service worker (Workbox autoUpdate) will detect the new build and refresh automatically on the next visit.
