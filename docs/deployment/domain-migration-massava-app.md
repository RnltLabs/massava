# Domain Migration: massava.app

## Overview
Migrating Massava from `rnltlabs.de/massava` to dedicated domain `massava.app`.

**Linear Issue**: [RNLT-43](https://linear.app/rnlt-labs/issue/RNLT-43)

## Current Setup
- **Production**: `rnltlabs.de/massava/` → `localhost:3004` (Docker container on port 3004)
- **Staging**: `staging.rnltlabs.de/massava/` → `localhost:3005`
- **Server**: Hetzner Cloud - `91.98.69.15`

## New Setup
- **Production**: `massava.app` → `localhost:3004`
- **Staging**: `staging.massava.app` → `localhost:3005`

## DNS Configuration (IONOS)

### Required DNS Records

You need to add these A records in the IONOS control panel for `massava.app`:

```
Type    Name       Value           TTL
A       @          91.98.69.15     3600
A       www        91.98.69.15     3600
A       staging    91.98.69.15     3600
```

### How to Configure DNS at IONOS

1. Log in to IONOS account: https://www.ionos.de
2. Go to **Domains & SSL** section
3. Click on `massava.app`
4. Navigate to **DNS Settings** or **Domain Settings**
5. Add the following A records:
   - **Subdomain**: `@` (root domain) → **Points to**: `91.98.69.15`
   - **Subdomain**: `www` → **Points to**: `91.98.69.15`
   - **Subdomain**: `staging` → **Points to**: `91.98.69.15`
6. Set TTL to 3600 seconds (1 hour) for faster updates initially
7. Save changes

**Note**: DNS propagation can take 15 minutes to 48 hours. Use tools like `dig massava.app` or https://dnschecker.org to verify.

## Server Configuration Steps

### 1. nginx Configuration

Create new nginx config at `/root/projects/nginx/sites/massava.conf`:

```nginx
# Production - massava.app
server {
    server_name massava.app www.massava.app;

    location / {
        proxy_pass http://localhost:3004;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
    listen [::]:80;
}

# Staging - staging.massava.app
server {
    server_name staging.massava.app;

    location / {
        proxy_pass http://localhost:3005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 80;
    listen [::]:80;
}
```

### 2. Enable nginx Site

```bash
# Create symlink
sudo ln -s /root/projects/nginx/sites/massava.conf /etc/nginx/sites-enabled/massava.conf

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### 3. SSL Certificates with Let's Encrypt

**Important**: DNS must be configured and propagated BEFORE running certbot!

```bash
# Verify DNS is working first
dig massava.app
dig staging.massava.app

# Install certbot if not already installed
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificates for both domains
sudo certbot --nginx -d massava.app -d www.massava.app
sudo certbot --nginx -d staging.massava.app

# Certbot will automatically update the nginx config with SSL
```

After running certbot, nginx will be automatically configured with:
- SSL certificates
- HTTPS (443) listeners
- HTTP to HTTPS redirects

### 4. Container Port Mapping Check

Verify staging container has proper port mapping:

```bash
docker ps | grep massava
```

If `massava-staging` doesn't show port mapping to 3005, update docker-compose or restart with proper port mapping.

## Application Configuration Updates

### Environment Variables

Update these environment variables in the containers:

**Production** (`massava` container):
```env
NEXTAUTH_URL=https://massava.app
NEXT_PUBLIC_BASE_URL=https://massava.app
```

**Staging** (`massava-staging` container):
```env
NEXTAUTH_URL=https://staging.massava.app
NEXT_PUBLIC_BASE_URL=https://staging.massava.app
```

### Update NextAuth Configuration

In `src/lib/auth.ts` or wherever NextAuth is configured, ensure the `basePath` is set correctly:

```typescript
export const authOptions: NextAuthOptions = {
  // ...
  callbacks: {
    async session({ session, token }) {
      // Ensure session callback handles new domains
    }
  }
}
```

## Testing Checklist

### Pre-deployment
- [ ] DNS records configured at IONOS
- [ ] DNS propagation verified (`dig massava.app`)
- [ ] nginx config created and tested (`nginx -t`)
- [ ] Staging container port 3005 mapped

### After nginx + SSL setup
- [ ] `https://staging.massava.app` loads successfully
- [ ] `https://staging.massava.app/de` shows login/register
- [ ] SSL certificate is valid (no browser warnings)
- [ ] Login flow works on staging
- [ ] `https://massava.app` loads successfully
- [ ] `https://www.massava.app` redirects to `https://massava.app`
- [ ] Login flow works on production
- [ ] NextAuth redirects work correctly

### After full deployment
- [ ] Update documentation with new domain
- [ ] Update any external links/references
- [ ] Monitor logs for any errors
- [ ] Keep old `rnltlabs.de/massava` working for transition period

## Rollback Plan

If issues occur:

1. **DNS Level**: Update DNS back to point to old domain (takes time)
2. **nginx Level**: Disable massava.conf symlink, reload nginx
3. **Application Level**: Revert environment variables to old domain

Keep `rnltlabs.de/massava` configuration active until massava.app is confirmed working for at least 1 week.

## Timeline

1. **Day 1**: Configure DNS at IONOS, wait for propagation
2. **Day 1-2**: Setup nginx config and SSL certificates
3. **Day 2**: Test staging environment thoroughly
4. **Day 3**: Deploy to production, monitor
5. **Week 1**: Parallel operation of both domains
6. **Week 2+**: Consider deprecating old domain

## References

- Linear Issue: [RNLT-43](https://linear.app/rnlt-labs/issue/RNLT-43)
- Server: Hetzner Cloud - SSH via `ssh hetzner`
- DNS Provider: IONOS
- SSL: Let's Encrypt (auto-renewed via certbot)
