# Smart Notes Vault - HTTPS Custom Domain Setup Guide

## Current Status ✅
- **Backend**: Deployed in prod account (us-east-1)
- **Frontend**: Deployed via ZIP upload to Amplify
- **Production Site**: `https://atalcloud.com` - WORKING ✅
- **App URL**: `https://main.d18tx3wn588nyo.amplifyapp.com` - WORKING ✅
- **Target**: `https://smartnote.atalcloud.com` - NEEDS SSL SETUP

## Current Infrastructure

### AWS Account Setup:
- **Production Account**: `022498999689` (profile: prod-0224)
- **Region**: us-east-1
- **Domain**: `atalcloud.com` hosted in Route 53

### Existing Resources:
- **Amplify App**: `main.d18tx3wn588nyo.amplifyapp.com`
- **CloudFront (Production)**: `E2MM9FDS0EKDMI` → `d2teowkpuvfgl6.cloudfront.net`
- **SSL Certificate**: `bbaccce5-916b-41bd-8b6e-3db51f891ae4` (*.atalcloud.com wildcard)
- **Route 53 A Record**: `atalcloud.com` → `d2teowkpuvfgl6.cloudfront.net`

## Next Step: CloudFront Distribution for HTTPS

### Why CloudFront is Needed:
- ✅ **Secure HTTPS** for custom domain
- ✅ **Uses existing SSL certificate** (no conflicts)
- ✅ **Safe for production site** (no Amplify domain management)
- ✅ **Cost**: Under $1/month for 100 requests

### CloudFront Setup Steps:

#### 1. Create Distribution:
```
CloudFront Console → Create Distribution

Origin Settings:
- Origin Domain: main.d18tx3wn588nyo.amplifyapp.com
- Protocol: HTTPS only
- Origin Path: (leave blank)

Distribution Settings:
- Alternate Domain Names (CNAMEs): smartnote.atalcloud.com
- Custom SSL Certificate: atalcloud.com (bbaccce5-916b-41bd-8b6e-3db51f891ae4)
- Security Policy: TLSv1.2_2021

Behavior Settings:
- Viewer Protocol Policy: Redirect HTTP to HTTPS
- Allowed HTTP Methods: GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
- Cache Policy: Managed-CachingDisabled (for dynamic content)
```

#### 2. Update Route 53:
```
Current CNAME Record:
- Name: smartnote.atalcloud.com
- Type: CNAME
- Value: main.d18tx3wn588nyo.amplifyapp.com

Update to:
- Name: smartnote.atalcloud.com
- Type: CNAME
- Value: [new-cloudfront-id].cloudfront.net
```

#### 3. Timeline:
- **CloudFront Creation**: 15-20 minutes
- **DNS Propagation**: 5-15 minutes
- **Total**: ~30 minutes

## Important Notes ⚠️

### DO NOT Use Amplify Domain Management:
- ❌ **Will break production site** (`atalcloud.com`)
- ❌ **Creates conflicting DNS records**
- ❌ **Overwrites CloudFront distribution**

### Keep Production Site Safe:
- ✅ **Never add `atalcloud.com` as root domain** in Amplify
- ✅ **Always use manual CloudFront + Route 53**
- ✅ **Monitor Route 53 A record** for `atalcloud.com`

## Testing Checklist

### After CloudFront Setup:
1. **Test Production Site**: `https://atalcloud.com` ✅
2. **Test Smart Notes**: `https://smartnote.atalcloud.com` 🎯
3. **Test App Features**:
   - Create account
   - Login/logout
   - Create notes
   - Upload files
   - Update notes
   - Delete notes
   - Bulk operations
   - User guide modal

## Cost Estimate
- **100 requests/month**: ~$0.01
- **Data transfer**: ~$0.10-0.50/month
- **Total**: **Under $1/month**

## Backup Commands

### Keep Sandbox Running:
```bash
# Terminal 1 (keep running)
cd D:\AWS_ED_prj\FullStackReactApp\notesapp
npx ampx sandbox --profile prod-0224
```

### Local Development:
```bash
# Terminal 2 (for local testing)
cd D:\AWS_ED_prj\FullStackReactApp\notesapp
npm run dev
```

### Build for Production:
```bash
npm run build
# Upload dist folder to Amplify if needed
```

## Repository
- **GitHub**: `https://github.com/ranjitbatra/notesapp`
- **Latest Commit**: Enhanced Smart Notes Vault with multiple file support

## Final Architecture
```
Users → https://smartnote.atalcloud.com 
     → CloudFront Distribution (SSL)
     → Amplify App (main.d18tx3wn588nyo.amplifyapp.com)
     → Backend (DynamoDB, S3, Cognito, AppSync)
```

---
**Next Session**: Create CloudFront distribution and update Route 53 CNAME record.

**Sleep well! 😴 Your Smart Notes Vault will be live with HTTPS soon! 🚀**