# Deployment Guide - 2×2 Community Matrix on TON

## Quick Start

The application is **ready for deployment** to Cloudflare Pages. Follow these steps:

## 🚀 Cloudflare Pages Deployment

### Step 1: Setup Cloudflare Account
1. Sign up at https://dash.cloudflare.com if you don't have an account
2. Install Wrangler CLI if not already installed: `npm install -g wrangler`
3. Login to Wrangler: `npx wrangler login`

### Step 2: Create Production D1 Database

```bash
# Create D1 database
npx wrangler d1 create ton-matrix-db

# Output will show:
# database_id = "your-actual-database-id-here"

# Copy the database_id and update wrangler.jsonc
# Replace "placeholder-will-be-set-on-first-deploy" with your actual database_id
```

Update `wrangler.jsonc`:
```jsonc
{
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "ton-matrix-db",
      "database_id": "your-actual-database-id-here"  // <- UPDATE THIS
    }
  ]
}
```

### Step 3: Apply Database Migrations

```bash
# Apply migrations to production D1 database
npm run db:migrate:prod

# You should see:
# ✅ 0001_initial_schema.sql
```

### Step 4: Create Cloudflare Pages Project

```bash
# Create project (one-time setup)
npx wrangler pages project create ton-community-matrix \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### Step 5: Set Environment Variables

```bash
# Set JWT secret (use a strong random string)
npx wrangler pages secret put JWT_SECRET --project-name ton-community-matrix
# When prompted, enter: a-very-strong-secret-key-at-least-32-characters

# Set TON network
npx wrangler pages secret put TON_NETWORK --project-name ton-community-matrix
# When prompted, enter: testnet

# Set TON API endpoint
npx wrangler pages secret put TON_API_ENDPOINT --project-name ton-community-matrix
# When prompted, enter: https://testnet.toncenter.com/api/v2/jsonRPC

# (Optional) Set environment type
npx wrangler pages secret put NODE_ENV --project-name ton-community-matrix
# When prompted, enter: production
```

### Step 6: Deploy

```bash
# Build and deploy
npm run deploy:prod

# You'll see output like:
# ✨ Deployment complete!
# 🌎 https://ton-community-matrix.pages.dev
# 🌎 https://main.ton-community-matrix.pages.dev
```

### Step 7: Verify Deployment

```bash
# Test health endpoint
curl https://ton-community-matrix.pages.dev/api/health

# Expected response:
# {"success":true,"message":"2×2 Community Matrix API is running","timestamp":"..."}
```

## 🔧 Post-Deployment Configuration

### Update TonConnect Manifest

After deployment, update the URLs in `public/tonconnect-manifest.json`:

```json
{
  "url": "https://your-actual-domain.pages.dev",
  "name": "2×2 Community Matrix",
  "iconUrl": "https://your-actual-domain.pages.dev/icon-512.png",
  "termsOfUseUrl": "https://your-actual-domain.pages.dev/terms",
  "privacyPolicyUrl": "https://your-actual-domain.pages.dev/privacy"
}
```

Then redeploy:
```bash
npm run deploy:prod
```

### Create First Admin User

After deployment, you'll need to manually set a user as admin in the D1 database:

```bash
# Option 1: Via wrangler CLI
npx wrangler d1 execute ton-matrix-db \
  --command="UPDATE users SET is_admin = 1 WHERE email = 'your-admin-email@example.com'"

# Option 2: Via D1 console in Cloudflare dashboard
# 1. Go to Cloudflare Dashboard > Workers & Pages > D1
# 2. Select ton-matrix-db
# 3. Click "Query" tab
# 4. Run: UPDATE users SET is_admin = 1 WHERE email = 'your-admin-email@example.com'
```

## 🔄 Continuous Deployment

### From GitHub (Recommended)

1. **Push code to GitHub**:
```bash
git remote add origin https://github.com/your-username/ton-community-matrix.git
git push -u origin main
```

2. **Connect to Cloudflare Pages**:
   - Go to Cloudflare Dashboard > Workers & Pages
   - Click "Create application" > "Pages" > "Connect to Git"
   - Select your repository
   - Build settings:
     - Build command: `npm run build`
     - Build output directory: `dist`
     - Root directory: `/`
   - Environment variables: (add the same secrets as Step 5 above)
   - Click "Save and Deploy"

3. **Automatic deployments**: Every push to `main` branch will automatically deploy

### Manual Deployment

```bash
# Build locally
npm run build

# Deploy
npx wrangler pages deploy dist --project-name ton-community-matrix

# For production
npx wrangler pages deploy dist --project-name ton-community-matrix --branch main
```

## 🌐 Custom Domain (Optional)

1. **Add custom domain in Cloudflare Pages**:
   - Go to your Pages project
   - Click "Custom domains" tab
   - Click "Set up a custom domain"
   - Enter your domain (e.g., `matrix.yourdomain.com`)
   - Follow DNS setup instructions

2. **Update TonConnect manifest** with your custom domain and redeploy

## 📊 Monitoring & Logs

### View Logs

```bash
# Stream logs
npx wrangler pages deployment tail --project-name ton-community-matrix

# View specific deployment logs
npx wrangler pages deployment list --project-name ton-community-matrix
```

### Check D1 Database

```bash
# Query database
npx wrangler d1 execute ton-matrix-db \
  --command="SELECT COUNT(*) as user_count FROM users"

# Open D1 console
# Go to Cloudflare Dashboard > D1 > ton-matrix-db > Query tab
```

### Analytics

- View real-time analytics in Cloudflare Dashboard
- Monitor requests, errors, and performance
- Set up alerts for high error rates

## 🔐 Security Checklist

- [ ] Changed default JWT_SECRET to a strong random value
- [ ] Verified all environment variables are set
- [ ] Database migrations applied successfully
- [ ] First admin user created
- [ ] Tested registration flow
- [ ] Tested login flow
- [ ] TON wallet connection working
- [ ] Matrix placement logic verified
- [ ] Custom domain configured (if applicable)
- [ ] TonConnect manifest URLs updated

## 🆘 Troubleshooting

### Build Errors

```bash
# Clear cache and rebuild
rm -rf dist node_modules
npm install
npm run build
```

### Migration Issues

```bash
# Check migration status
npx wrangler d1 migrations list ton-matrix-db

# Rollback if needed (not recommended for production)
# Manual rollback via D1 console
```

### Environment Variable Issues

```bash
# List all secrets
npx wrangler pages secret list --project-name ton-community-matrix

# Delete and re-add if needed
npx wrangler pages secret delete JWT_SECRET --project-name ton-community-matrix
npx wrangler pages secret put JWT_SECRET --project-name ton-community-matrix
```

### Database Connection Issues

- Verify database_id in wrangler.jsonc matches your D1 database
- Ensure migrations were applied: `npm run db:migrate:prod`
- Check D1 console for any error messages

## 📈 Scaling Considerations

### Cloudflare Pages Limits (Free Plan)
- 500 deployments per month
- Unlimited requests
- Unlimited bandwidth
- 100,000 D1 reads per day
- 1,000 D1 writes per day

### Upgrade Path
If you exceed free tier limits:
1. Upgrade to Cloudflare Pages Pro ($20/month)
2. Upgrade D1 to paid tier for higher limits
3. Consider caching strategies for read-heavy operations

## 🎉 Success!

Your 2×2 Community Matrix on TON is now deployed and ready for users!

**Next Steps:**
1. Share your referral links
2. Monitor user registrations
3. Deploy TON smart contract (when ready)
4. Integrate real on-chain contributions

---

**For production support**: Review Cloudflare Pages documentation at https://developers.cloudflare.com/pages/
