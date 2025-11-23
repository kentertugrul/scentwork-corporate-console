# Supabase Quick Start - Scentwork Corporate

## 5-Minute Setup

### 1. Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Click **"New Project"**
3. Fill in:
   - Name: `scentwork-corporate`
   - Database Password: (create a strong password and save it)
   - Region: (choose closest to your location)
4. Click **"Create new project"**
5. Wait ~2 minutes

### 2. Get Your Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public** key (starts with `eyJhbGc...`)
   - **Service role** key (starts with `eyJhbGc...`)

### 3. Set Up Environment Variables

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit .env.local and paste your credentials
# NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### 4. Create Database Tables

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Open `supabase/migrations/001_initial_schema.sql` from your project
4. Copy and paste the entire SQL into the Supabase SQL Editor
5. Click **"Run"**

### 5. Test the Connection

```bash
# Install dependencies (if not done)
npm install

# Start dev server
npm run dev

# Open browser
http://localhost:3001
```

## That's it!

Your Scentwork Corporate Console is now connected to Supabase!

## Next Steps

- Configure authentication providers
- Add sample data
- Set up Edge Functions for commission calculations
- Enable real-time subscriptions

See `SUPABASE_INTEGRATION.md` for complete integration details.

