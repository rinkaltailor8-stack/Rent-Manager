# Vercel Deployment Checklist

## ✅ Pre-Deployment Steps

1. **Ensure all files are committed to Git**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Verify package.json has correct build script**
   - ✅ `"build": "react-scripts build"` is present

3. **Verify vercel.json exists and is configured correctly**
   - ✅ Has API routing to `/api/index.js`
   - ✅ Has static build configuration

## 🚀 Vercel Setup

1. **Import Project in Vercel**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Framework Preset: `Create React App`
   - Root Directory: `./` (leave empty or use `.`)

2. **Configure Environment Variables**
   Add these in Vercel Project Settings → Environment Variables:
   
   ```
   MONGODB_URI=mongodb+srv://rinkalktailor1234_db_user:DnJkIyAeGNDlrpME@rinkal.nmuaxpt.mongodb.net/
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   NODE_ENV=production
   ```

3. **Update CORS (if using different domain)**
   If your Vercel domain is different from `rent-manager-by-rinkal.vercel.app`,
   update `api/index.js` line 18-22 to include your new domain.

## 🔍 Troubleshooting

### 404 Errors
- ✅ Make sure `vercel.json` routes API calls to `/api/index.js`
- ✅ Verify API baseURL in `src/services/api.js` is `/api/`
- ✅ Check that environment variables are set in Vercel dashboard

### CORS Errors
- ✅ Add your Vercel domain to `allowedOrigins` array in `api/index.js`
- ✅ Ensure credentials: true is set in CORS config

### MongoDB Connection Issues
- ✅ Verify MONGODB_URI environment variable in Vercel
- ✅ Check MongoDB Atlas Network Access allows connections from anywhere (0.0.0.0/0)
- ✅ Ensure database user has proper permissions

### Build Failures
- ✅ Run `npm run build` locally to check for build errors
- ✅ Fix any warnings or errors before deploying
- ✅ Check Vercel build logs for specific error messages

## 📝 Post-Deployment

1. **Test API Endpoints**
   ```
   https://your-app.vercel.app/api/health
   ```

2. **Test Authentication**
   - Register a new user
   - Login
   - Access protected routes

3. **Verify MongoDB Connection**
   - Check Vercel function logs
   - Ensure "MongoDB connected" message appears

## 🎯 Current Status

Your app is configured for:
- ✅ Local development (localhost:3000 + localhost:8000)
- ✅ Vercel production deployment
- ✅ MongoDB Atlas database
- ✅ JWT authentication
- ✅ CORS configured for both environments
