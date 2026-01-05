# Glued

A calm, intentional social connection app. Connect with up to 3 people at a time. No infinite browsing, swiping, or engagement loops.

## Features

- **3-connection limit**: Users can have at most 3 active connections at any time
- **Explicit resolution**: Connections must be resolved as met, closed, or timed out
- **Time-bounded**: Each connection has a 14-day window
- **No infinite browsing**: One suggestion at a time
- **Magic link authentication**: Secure, password-free login

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Magic link email authentication
- **Deployment**: Ready for Vercel

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- A Supabase account and project

### 1. Clone and Install

```bash
# Clone the repository (or use this directory)
cd Glued

# Install dependencies
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings** → **API** and copy:
   - Project URL
   - Anon/Public key

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run Database Migrations

1. In your Supabase project, go to **SQL Editor**
2. Create a new query
3. Copy the contents of `supabase/migrations/001_initial_schema.sql`
4. Run the query

This will create:
- `profiles` and `connections` tables
- `connection_status` enum type
- Row Level Security (RLS) policies
- Database trigger to enforce max 3 active connections
- Helper functions for connection management

### 5. Configure Email Settings (Optional)

For magic link authentication to work:

1. Go to **Authentication** → **Email Templates** in Supabase
2. Optionally customize the magic link email template
3. For production, configure a custom SMTP provider in **Project Settings** → **Auth**

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Glued/
├── app/                          # Next.js App Router
│   ├── auth/
│   │   └── callback/            # OAuth callback handler
│   ├── connections/[id]/        # Connection detail page
│   ├── dashboard/               # Main dashboard (3 slots)
│   ├── login/                   # Magic link login
│   ├── onboarding/              # User onboarding flow
│   ├── resolve/[id]/            # Connection resolution flow
│   ├── suggestion/              # View and accept suggestions
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Root redirect
│   └── globals.css              # Global styles
├── components/                  # React components
│   ├── DashboardSlot.tsx        # Individual connection slot
│   ├── ExpiredConnectionsNotice.tsx
│   ├── MessagePlaceholder.tsx   # MVP messaging placeholder
│   ├── ResolveFlow.tsx          # Multi-step resolution UI
│   └── SuggestionCard.tsx       # Suggestion accept/pass
├── lib/
│   ├── data/                    # Data access layer
│   │   ├── connections.ts       # Connection queries
│   │   └── suggestions.ts       # Suggestion logic
│   └── supabase/                # Supabase configuration
│       ├── client.ts            # Browser client
│       ├── server.ts            # Server client
│       ├── middleware.ts        # Auth middleware
│       └── types.ts             # TypeScript types
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql
├── middleware.ts                # Next.js middleware for auth
└── package.json
```

## Key Screens

### 1. `/login`
Magic link email authentication

### 2. `/onboarding`
- Contract screen: "Three connections, max"
- Profile setup: name, area, interests, availability

### 3. `/dashboard` (Core)
- 3 connection slots
- Active connections show: name, intent, days remaining
- Empty slots: "Get a suggestion" button
- At capacity: disabled state with message

### 4. `/suggestion`
- One profile at a time
- Accept or Pass
- Shows intent overlap and availability overlap

### 5. `/connections/[id]`
- Connection details
- "Resolve" and "Message" buttons

### 6. `/resolve/[id]`
- Step 1: Choose outcome (met / closed / timed out)
- Step 2: Optional closing note
- Updates connection status and frees slot

## Database Enforcement

The database enforces the 3-connection limit via a PostgreSQL trigger:

- `enforce_max_three_active()` function blocks any INSERT or UPDATE that would give a user more than 3 active connections
- This is enforced at the database level, so it's impossible to bypass
- RLS policies ensure users can only access their own data

## Resolution States

Connections can be resolved in three ways:

1. **met**: You met in person or had a real call
2. **closed**: Mutually decided to close the connection
3. **timed_out**: The 14-day window expired

## Timeout Handling (MVP)

- On dashboard load, checks for expired connections
- Prompts user to mark expired connections as "timed out"
- Simple deterministic approach (no cron job needed for MVP)

## Copy Guidelines

The app uses calm, neutral, firm copy:
- Short sentences
- No therapeutic language
- Clear and direct
- Not overly positive or negative

## Next Steps for Production

1. **Email provider**: Configure custom SMTP in Supabase for production emails
2. **In-app messaging**: Replace WhatsApp placeholder with real chat
3. **Cron job**: Auto-resolve timed out connections
4. **Better matching**: Implement sophisticated suggestion algorithm
5. **Notifications**: Email/push for connection events
6. **Analytics**: Track user behavior and connection outcomes
7. **Testing**: Add unit and E2E tests

## Deployment

### Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

The app is optimized for Vercel's edge network and works seamlessly with Next.js App Router.

## License

MIT

---

Built with intention. Three connections, max.
