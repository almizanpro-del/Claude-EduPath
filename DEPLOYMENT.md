# EduPath MVP - Production Deployment Guide

## Pre-Deployment Checklist

- [ ] Environment variables configured in `.env.local`
- [ ] Supabase database fully set up with tables
- [ ] Sample universities data added (at least 50)
- [ ] Authentication working (test signup/login)
- [ ] Reviews system working
- [ ] Cost calculator tested
- [ ] Mobile responsiveness verified
- [ ] No console errors or warnings

## Deployment Option 1: Vercel (Recommended) ⭐

### Why Vercel?
- ✅ Free tier (unlimited deployments)
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero-config deployment
- ✅ Integrates perfectly with Next.js
- ✅ Excellent performance

### Setup (5 minutes)

1. **Create GitHub Repository**

```bash
cd ~/edupath-mvp
git init
git add .
git commit -m "Initial commit: EduPath MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/edupath-mvp.git
git push -u origin main
```

2. **Go to [vercel.com](https://vercel.com)**
   - Sign up with GitHub
   - Click "New Project"
   - Select `edupath-mvp` repository
   - Click "Import"

3. **Add Environment Variables**

In Vercel dashboard → Project Settings → Environment Variables, add:

```
NEXT_PUBLIC_SUPABASE_URL = https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your-anon-key-here
NEXT_PUBLIC_APP_URL = https://edupath.vercel.app
```

4. **Deploy**

Click "Deploy" button. Wait ~2 minutes. Your app is live! 🎉

### Update Supabase CORS

Allow your Vercel domain in Supabase:

1. Supabase → Project Settings → API
2. Under "CORS configuration", add your domain:
   - `https://edupath.vercel.app`
   - Or your custom domain

## Deployment Option 2: Self-Hosted (Docker)

### Prerequisites
- Docker installed
- Server with 2GB RAM minimum
- Ubuntu 20.04+ or similar

### Setup

1. **Create Dockerfile**

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

2. **Build Image**

```bash
docker build -t edupath-mvp .
```

3. **Run Container**

```bash
docker run -d \
  --name edupath \
  -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL='https://your-project.supabase.co' \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY='your-anon-key' \
  edupath-mvp
```

4. **Setup Reverse Proxy (Nginx)**

```nginx
server {
    listen 80;
    server_name edupath.io;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

5. **Add SSL (Let's Encrypt)**

```bash
certbot certonly --nginx -d edupath.io
```

## Deployment Option 3: Railway.app (Simple Alternative)

1. Go to [railway.app](https://railway.app)
2. Create account with GitHub
3. Create new project → GitHub repo
4. Add environment variables
5. Deploy (automatic)

Free tier includes 500 hours/month (enough for MVP)

## Post-Deployment Tasks

### 1. Enable Email Verification

Supabase → Authentication → Providers → Email

- Toggle "Confirm email" to ON
- Users must verify email to sign up

### 2. Add Custom Domain

**Vercel:**
- Project Settings → Domains
- Add your domain (edupath.io, edupath.com, etc.)
- Add DNS records as shown

**Self-hosted:**
- Point A record to your server IP
- Set up SSL certificate

### 3. Monitor Performance

**Vercel Analytics:**
- Dashboard → Analytics
- Monitor Web Vitals
- Track usage patterns

**Supabase Monitoring:**
- Project → Database → Monitoring
- Check query performance
- Monitor storage usage

### 4. Setup Error Tracking (Optional)

**Sentry Integration:**

```bash
npm install @sentry/nextjs
```

Update `next.config.js`:

```js
const withSentry = require('@sentry/nextjs/withSentry')

module.exports = withSentry({
  org: 'your-org',
  project: 'edupath',
})
```

## Database Backup Strategy

### Supabase Auto-Backup (Free)

- Daily automatic backups
- 7-day retention
- Manual backups available

### Manual Backup

```bash
# Export database
pg_dump \
  postgresql://user:password@db.supabase.co/postgres \
  > backup.sql

# Restore from backup
psql postgresql://user:password@db.supabase.co/postgres < backup.sql
```

## Security Hardening

### 1. Enable Row-Level Security (RLS)

Already enabled in `database.sql` ✓

### 2. Set Up Firewall Rules

Supabase → Project Settings → Firewall

Allow only your domains:
- `edupath.io`
- `edupath.vercel.app`

### 3. Rotate Secrets Regularly

Update Supabase keys every 3 months:

1. Supabase → Settings → API
2. Regenerate "Anon Key"
3. Update in Vercel environment variables
4. Redeploy app

### 4. Enable Email Verification

Supabase → Auth → Email → Toggle "Confirm email"

## Performance Optimization

### 1. Enable Image Optimization

In `next.config.js`, images are already optimized ✓

### 2. Database Query Optimization

- Use indexes (included in schema)
- Limit results: `query.limit(20)`
- Filter early: `where country = 'Turkey'`

### 3. Caching Strategy

Next.js automatically caches:
- Static pages (revalidate every 3600 seconds)
- Images (optimized, cached globally)

## Monitoring Checklist

### Daily
- [ ] Check error logs (Vercel dashboard)
- [ ] Monitor database performance
- [ ] Review user signups

### Weekly
- [ ] Analyze page load times
- [ ] Check database backups
- [ ] Review analytics dashboard

### Monthly
- [ ] Security audit
- [ ] Database optimization
- [ ] User feedback review
- [ ] Plan next features

## Troubleshooting Production Issues

### App Shows "Server Error"

```bash
# Check logs in Vercel dashboard
# Or self-hosted: docker logs edupath
```

### Database Connection Fails

1. Check environment variables are correct
2. Verify Supabase project is not paused
3. Check CORS settings in Supabase
4. Restart container (if self-hosted)

### Slow Page Load

1. Check Vercel Analytics
2. Optimize database queries
3. Enable caching headers
4. Reduce image sizes

### Authentication Not Working

1. Clear browser cookies
2. Verify Supabase Auth is enabled
3. Check redirect URLs in OAuth settings

## Scaling Beyond MVP

### When you reach 1,000+ users:
- Upgrade Supabase plan (real-time sync)
- Add caching layer (Redis)
- Set up CDN for static assets
- Implement rate limiting

### When you reach 10,000+ users:
- Separate read/write database replicas
- Implement full-text search index
- Add analytics database
- Set up API rate limiting

### When you reach 100,000+ users:
- Microservices architecture
- Message queue for async tasks
- Multi-region deployment
- Advanced caching strategies

## Support & Resources

- **Vercel Docs**: https://vercel.com/docs
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Docker Docs**: https://docs.docker.com

## Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Environment variables configured
- [ ] Supabase database set up
- [ ] Sample data added
- [ ] App deployed to Vercel (or self-hosted)
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Email verification enabled
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Error tracking enabled
- [ ] Analytics dashboard reviewed
- [ ] Launch announcement ready
- [ ] Beta user invite list prepared

---

## Go Live! 🚀

Your EduPath MVP is now production-ready. Next step: invite 50-100 MENA students for beta testing!
