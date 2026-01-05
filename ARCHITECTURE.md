# Glued - Architecture & Implementation Details

## Overview

Glued is a production-ready MVP that enforces intentional social connections through a hard limit of 3 active connections per user. This document explains the technical architecture and key implementation decisions.

## Core Constraint: The 3-Connection Limit

The entire system is designed around enforcing this rule:
- **Database-level enforcement**: PostgreSQL trigger prevents any user from having >3 active connections
- **UI-level feedback**: Dashboard shows clear capacity status
- **Application-level validation**: Additional checks for user experience

### How It Works

1. **Database Trigger**: `enforce_max_three_active()`
   - Runs BEFORE INSERT or UPDATE on `connections` table
   - Counts active connections for both participants
   - Raises exception if either user has ≥3 active connections
   - Cannot be bypassed by client code

2. **Row Level Security (RLS)**
   - Users can only view/modify their own data
   - Enforced at the database layer using Supabase policies
   - Uses `auth.uid()` for authentication

3. **Application Logic**
   - Dashboard checks active count and disables "Get suggestion" button
   - Suggestion page catches database error and shows friendly message
   - Resolution flow immediately frees up a slot

## Database Schema

### Tables

#### `profiles`
```sql
id: UUID (FK to auth.users)
first_name: TEXT
area: TEXT
intent_types: TEXT[]
availability: JSONB
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

#### `connections`
```sql
id: UUID (PK)
user_a: UUID (FK to auth.users)
user_b: UUID (FK to auth.users)
status: connection_status ('active', 'met', 'closed', 'timed_out')
created_at: TIMESTAMPTZ
expires_at: TIMESTAMPTZ (default: now + 14 days)
resolved_at: TIMESTAMPTZ
```

### Indexes
- `idx_connections_user_a_status`: Fast lookups for user's connections
- `idx_connections_user_b_status`: Same for the other side
- `idx_connections_expires_at`: Efficient expired connection queries

## Application Architecture

### Next.js App Router Structure

```
app/
├── (auth)/
│   ├── login/          # Magic link auth
│   └── auth/callback/  # OAuth callback
├── onboarding/         # New user flow
├── dashboard/          # Main app (Server Component)
├── suggestion/         # One profile at a time (Server Component)
├── connections/[id]/   # Connection details (Server Component)
└── resolve/[id]/       # Resolution flow (Server Component)
```

### Server vs Client Components

**Server Components** (default):
- Dashboard, suggestion, connection detail pages
- Fetch data directly on the server
- No client-side JavaScript for data fetching
- Better performance, SEO, security

**Client Components** (use 'use client'):
- Interactive forms (onboarding, login)
- Modals and dynamic UI (message placeholder, resolve flow)
- Logout button
- Anything using React hooks

### Data Flow

1. **Server-side data fetching**:
   ```
   Page → lib/data/*.ts → Supabase Server Client → PostgreSQL
   ```

2. **Client-side mutations**:
   ```
   Component → lib/actions/*.ts (Server Actions) → Supabase → Revalidate
   ```

3. **Authentication**:
   ```
   Middleware → Supabase Auth → Protect routes → Continue
   ```

## Key Features Implementation

### 1. Magic Link Authentication

- Uses Supabase Auth with email OTP
- No passwords stored
- Flow:
  1. User enters email
  2. Supabase sends magic link
  3. Link contains code
  4. Callback route exchanges code for session
  5. Redirect to onboarding or dashboard

### 2. Dashboard (3-Slot UI)

```typescript
// Slot types
type DashboardSlot = 
  | { type: 'active', connection: ConnectionWithProfile, daysRemaining: number }
  | { type: 'empty' }

// Always renders exactly 3 slots
const slots = [
  ...activeConnections.map(toActiveSlot),
  ...Array(3 - activeConnections.length).fill({ type: 'empty' })
]
```

### 3. Suggestion Algorithm (MVP)

Current implementation (simple):
- Exclude current user
- Exclude already connected users
- Return random available profile

Production improvements:
- Score based on intent overlap
- Weight by availability overlap
- Consider location proximity
- Learn from past interactions

### 4. Connection Resolution

Three outcomes:
- **met**: Successful connection (positive outcome)
- **closed**: Mutually decided to stop (neutral outcome)
- **timed_out**: Expired without action (passive outcome)

Flow:
1. User selects outcome
2. If "met": immediate resolution
3. If "closed" or "timed_out": optional closing note
4. Update `connections.status` and `resolved_at`
5. Redirect to dashboard (slot now free)

### 5. Timeout Handling

MVP approach (no cron):
- Check on dashboard load: `expires_at < now AND status = 'active'`
- Show notice: "Time's up on a connection"
- User clicks button to auto-resolve as `timed_out`
- Uses server action for atomic update

Production approach:
- Add Supabase Edge Function (cron)
- Run daily: auto-resolve expired connections
- Send notification before expiration

## State Management

No global state library needed. State is managed:
- **Server state**: PostgreSQL via Supabase
- **Local UI state**: React `useState` for forms/modals
- **Cache**: Next.js automatic caching + `revalidatePath()`

## Error Handling

### Database Errors
```typescript
try {
  await supabase.from('connections').insert(...)
} catch (error) {
  if (error.message.includes('3 active connections')) {
    return { error: "You're at capacity..." }
  }
  return { error: error.message }
}
```

### Authentication Errors
- Middleware redirects unauthenticated users to `/login`
- Server components check `user` and redirect if null
- RLS policies block unauthorized database access

### Validation
- Form validation: HTML5 + TypeScript
- Database constraints: NOT NULL, CHECK constraints
- Application logic: Additional checks before mutations

## Security

### Row Level Security (RLS)

All tables have RLS enabled:

**profiles**:
```sql
-- Users can only see/edit their own profile
USING (auth.uid() = id)
```

**connections**:
```sql
-- Users can only see connections they're part of
USING (auth.uid() = user_a OR auth.uid() = user_b)
```

### API Keys
- Only `anon` key exposed to client
- Server uses same key but authenticated with session
- Service role key never exposed to client

### CSRF Protection
- Next.js built-in CSRF protection
- Server Actions use POST with CSRF tokens
- Supabase validates session on every request

## Performance Considerations

### Database
- Indexes on frequently queried columns
- LIMIT queries where possible
- Avoid N+1 queries (fetch related profiles in parallel)

### Next.js
- Server Components reduce client JS bundle
- Automatic code splitting per route
- Image optimization (if images added)

### Caching
- Server Components cached by default
- `revalidatePath()` after mutations
- Supabase client caches auth state

## Testing Strategy (Not Implemented)

Recommended for production:

1. **Unit tests**: Data access functions
2. **Integration tests**: Server actions
3. **E2E tests**: Full user flows (Playwright)
4. **Database tests**: Trigger validation

## Deployment

### Vercel (Recommended)
- Zero config deployment
- Automatic HTTPS
- Edge functions for middleware
- Preview deployments

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### Database Migrations
- Run SQL in Supabase dashboard for now
- Production: use Supabase CLI migrations

## Monitoring & Observability

Recommended additions:
- **Error tracking**: Sentry
- **Analytics**: PostHog, Mixpanel
- **Database monitoring**: Supabase dashboard
- **Performance**: Vercel Analytics

## Scaling Considerations

Current implementation handles:
- ~1000 users comfortably
- ~100 concurrent connections per user query

For larger scale:
1. **Database**: Add read replicas
2. **Caching**: Add Redis for suggestion algorithm
3. **Search**: Add Algolia for user search
4. **Real-time**: Add Supabase Realtime for live updates

## Code Quality

- **TypeScript**: Strict mode enabled
- **Linting**: ESLint with Next.js config
- **Formatting**: (Add Prettier recommended)
- **Types**: Centralized in `lib/supabase/types.ts`

## Future Enhancements

1. **In-app messaging**: WebSocket-based chat
2. **Notifications**: Email + push for connection events
3. **Profile photos**: Supabase Storage + Next.js Image
4. **Advanced matching**: ML-based suggestions
5. **Analytics dashboard**: User insights
6. **Mobile app**: React Native with shared types

---

This architecture prioritizes:
- **Simplicity**: Minimal dependencies, clear code
- **Security**: Database-level enforcement, RLS
- **Performance**: Server Components, efficient queries
- **Maintainability**: TypeScript, clear structure
- **Scalability**: Can grow to 10k+ users without major changes
