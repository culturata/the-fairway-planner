# Fairway Planner - Trip MVP

A comprehensive golf trip management application for planning and running multi-day golf trips with your group.

## Features

### Trip Management
- Create and manage golf trips tied to Clerk Organizations
- Set trip details (name, location, dates)
- Configure handicap rules (percentage and cap)
- Trip status tracking (Draft, Active, Completed)

### Itinerary Planning
- Build day-by-day schedules with multiple item types:
  - Golf rounds
  - Lodging
  - Dining
  - Activities
  - Travel
  - General notes
- Timeline view organized by date

### Rounds & Tee Sheets
- Create golf rounds with course details
- Organize players into tee groups
- Set tee times and starting holes
- Automatic scorecard creation for all participants

### Scoring System
- Stroke play scoring with 18-hole support
- Real-time score entry and updates
- Automatic gross and net score calculation
- Scorecard status tracking (In Progress, Submitted, Locked)
- Organizer can lock scorecards to prevent further edits

### Handicap Management
- Manual handicap assignment per player
- Configurable trip handicap percentage
- Optional handicap cap
- Automatic net score calculation based on trip rules

### Leaderboards
- Round-specific leaderboards (gross and net)
- Cumulative trip leaderboards
- Live updates as scores are entered

### Payments
- Stripe Checkout integration
- Support for required and optional cost items
- Track payment status per player
- Secure webhook handling for payment verification

### Roster & RSVP
- View all trip members
- RSVP status tracking (Invited, Going, Maybe, Declined)
- Payment status visibility

### Announcements
- Organizers can post trip-wide announcements
- Chronological feed visible to all members

## Technology Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Authentication**: Clerk (with Organizations support)
- **Payments**: Stripe
- **Hosting**: Netlify
- **CI/CD**: GitHub Actions

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Neon account)
- Clerk account with Organizations enabled
- Stripe account

### Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/fairway_planner"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Installation

1. Install dependencies:
```bash
npm install
```

2. Generate Prisma client:
```bash
npm run prisma:generate
```

3. Run database migrations:
```bash
npm run prisma:migrate
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

### Database Setup

The application uses Prisma for database management. The schema includes:

- `UserProfile` - User information linked to Clerk
- `Trip` - Trip details and settings
- `TripMember` - Membership with RSVP and handicap
- `ItineraryItem` - Schedule items
- `Round` - Golf rounds
- `TeeGroup` - Tee time pairings
- `Scorecard` - Player scorecards
- `HoleScore` - Individual hole scores
- `TripCostItem` - Payment items
- `Payment` - Payment records
- `Announcement` - Trip announcements

### Stripe Webhook Setup

For local development, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret to your `.env` file as `STRIPE_WEBHOOK_SECRET`.

For production, configure the webhook endpoint in your Stripe dashboard:
- URL: `https://yourdomain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`

## Project Structure

```
fairway-planner/
├── app/                      # Next.js App Router
│   ├── api/                  # API routes
│   │   ├── me/              # User profile endpoints
│   │   ├── trips/           # Trip management
│   │   ├── rounds/          # Round management
│   │   ├── scorecards/      # Scoring
│   │   ├── tee-groups/      # Tee sheet management
│   │   └── stripe/          # Payment processing
│   ├── dashboard/           # Main dashboard
│   ├── t/[tripId]/          # Trip pages
│   ├── r/[roundId]/         # Round pages
│   ├── payments/            # Payment pages
│   └── sign-in/             # Auth pages
├── lib/                     # Shared utilities
│   ├── prisma.ts           # Prisma client
│   ├── permissions.ts      # Role-based access control
│   └── utils.ts            # Helper functions
├── prisma/                  # Database schema and migrations
├── .github/workflows/       # CI/CD configuration
└── netlify.toml            # Netlify deployment config
```

## API Endpoints

### Authentication
- `POST /api/me/bootstrap` - Create/get user profile

### Trips
- `POST /api/trips` - Create or update trip
- `GET /api/trips` - Get current org's trip
- `GET /api/trips/:tripId` - Get trip details
- `POST /api/trips/:tripId/itinerary` - Add itinerary item
- `POST /api/trips/:tripId/cost-items` - Add cost item
- `POST /api/trips/:tripId/announcements` - Post announcement
- `PATCH /api/trips/:tripId/rsvp` - Update RSVP status
- `GET /api/trips/:tripId/leaderboard` - Get trip leaderboard

### Rounds
- `POST /api/rounds` - Create round
- `GET /api/rounds/:roundId` - Get round details
- `GET /api/rounds/:roundId/leaderboard` - Get round leaderboard

### Tee Groups
- `POST /api/tee-groups` - Create tee group with members

### Scorecards
- `POST /api/scorecards/:scorecardId/holes` - Update hole scores
- `POST /api/scorecards/:scorecardId/submit` - Submit scorecard
- `POST /api/scorecards/:scorecardId/lock` - Lock scorecard (organizer only)

### Payments
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Roles & Permissions

### Organizer (Clerk org:admin or org:owner)
- Create and manage trips
- Manage itinerary and cost items
- Create rounds and tee sheets
- Edit any player's scores
- Lock scorecards
- Post announcements

### Player (Clerk org:member)
- View trip details
- Update RSVP status
- Make payments
- Enter own scores
- View leaderboards

## Development

### Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio
```

### Code Quality

The project includes:
- ESLint for code linting
- TypeScript for type safety
- GitHub Actions for CI/CD (lint, typecheck, build)

## Deployment

### Netlify

1. Connect your GitHub repository to Netlify
2. Configure environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Environment Variables (Production)

Ensure all environment variables from `.env.example` are configured in your Netlify environment settings.

## Future Enhancements

Potential features for post-MVP versions:
- Multiple trips per organization
- Course directory with ratings and slopes
- Alternative scoring formats (Stableford, Match Play, Scramble)
- Side games (Skins, CTP, Long Drive)
- Photo sharing
- PDF exports for tee sheets and leaderboards
- Official handicap integration (GHIN)
- Offline scoring with sync

## License

Private - All rights reserved

## Support

For issues and feature requests, please use the GitHub issue tracker.
