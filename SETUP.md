# Glued - Quick Setup Guide

This guide will get you up and running with Glued locally in under 10 minutes.

## Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works fine)

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - Name: `glued-mvp`
   - Database Password: (generate a strong password)
   - Region: (choose closest to you)
4. Wait for the project to be created (~2 minutes)

### 3. Get Your Supabase Credentials

1. In your Supabase project, go to **Settings** (gear icon in sidebar)
2. Click **API**
3. Copy these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public** key (the long string under "Project API keys")

### 4. Create Environment File

Create a file named `.env.local` in the root of the project:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Replace the values with your actual credentials from step 3.

### 5. Run Database Migration

1. In Supabase, go to **SQL Editor** (in the left sidebar)
2. Click **New Query**
3. Open `supabase/migrations/001_initial_schema.sql` in your code editor
4. Copy the entire contents
5. Paste into the Supabase SQL Editor
6. Click **RUN** (or press Cmd/Ctrl + Enter)

You should see "Success. No rows returned" - this is correct!

### 6. Verify Tables Were Created

1. Go to **Table Editor** in Supabase sidebar
2. You should see two tables:
   - `profiles`
   - `connections`

### 7. Start the Development Server

```bash
npm run dev
```

### 8. Test the App

1. Open [http://localhost:3000](http://localhost:3000)
2. You should be redirected to `/login`
3. Enter your email address
4. Click "Send magic link"
5. Check your email (including spam folder)
6. Click the link in the email
7. You'll be redirected to the onboarding flow

## Troubleshooting

### "Invalid API key" error
- Check that your `.env.local` file has the correct values
- Make sure there are no extra spaces or quotes
- Restart the dev server after creating `.env.local`

### Magic link not arriving
- Check spam folder
- For development, Supabase uses their default email service which can be slow
- Go to **Authentication** → **Users** in Supabase to verify the user was created

### Database migration errors
- Make sure you copied the entire SQL file
- Check that you're in the correct Supabase project
- Try running the migration again (it's safe to run multiple times)

### "Not authenticated" errors
- Clear your browser cookies for localhost:3000
- Try logging in again
- Check that your Supabase project is active (not paused)

## Testing with Multiple Users

To test the connection flow, you'll need multiple users:

1. Open the app in a regular browser window (User A)
2. Open the app in an incognito/private window (User B)
3. Sign up both users with different email addresses
4. Complete onboarding for both
5. User A clicks "Get a suggestion" → should see User B
6. User A clicks "Accept"
7. Now both users should see the connection on their dashboards

## Next Steps

Once you have the app running:

1. Complete the onboarding flow
2. Create a second user account (use a different email or incognito window)
3. Test the suggestion and connection flow
4. Try resolving a connection
5. Verify the 3-connection limit works

## Production Deployment

See the main README.md for production deployment instructions (Vercel recommended).

---

Need help? Check the main README.md or review the Supabase documentation.
