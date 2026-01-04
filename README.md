# ⛳ Fairway Planner

> A comprehensive golf trip management platform for organizing multi-day golf trips with friends, colleagues, or tournament groups.

[![Built with Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748)](https://www.prisma.io/)

---

## 🎯 Overview

Fairway Planner simplifies the complexity of organizing golf trips by providing a centralized platform for:

- **Trip Planning** - Create itineraries with rounds, dining, lodging, and activities
- **Team Management** - Invite members, track RSVPs, and manage rosters
- **Scoring & Leaderboards** - Enter scores, calculate handicaps, and view live standings
- **Payment Collection** - Collect deposits and fees through integrated Stripe Checkout
- **Communication** - Post announcements and keep everyone informed

Perfect for annual golf trips, charity outings, corporate events, or buddy golf getaways.

---

## ✨ Key Features

### 📅 Trip & Itinerary Management
- Multi-day trip scheduling with customizable itinerary items
- Support for rounds, meals, lodging, activities, travel, and notes
- Timeline view organized by date
- Trip status tracking (Draft, Active, Completed)

### 🏌️ Rounds & Tee Sheets
- Create rounds with course name, tees, and tee times
- Organize players into tee groups with starting holes
- Automatic scorecard generation for all participants
- View and manage pairings

### 📊 Scoring & Handicaps
- 18-hole stroke play scoring with hole-by-hole entry
- Manual handicap assignment per player
- Configurable handicap percentage and cap per trip
- Automatic gross and net score calculation
- Scorecard status tracking (In Progress, Submitted, Locked)
- Organizer controls to lock final scores

### 🏆 Leaderboards
- Round-specific leaderboards (gross and net)
- Cumulative trip leaderboards across all rounds
- Real-time updates as scores are entered
- Sortable by gross or net scores

### 💳 Payments & Cost Management
- Create required and optional cost items (deposits, fees, etc.)
- Integrated Stripe Checkout for secure payments
- Track payment status per member
- Webhook-verified payment confirmation

### 👥 Roster & RSVP
- Clerk Organization-based membership
- RSVP status tracking (Invited, Going, Maybe, Declined)
- View member handicaps and payment status
- Role-based permissions (Organizer vs Player)

### 📢 Announcements
- Organizers can post trip-wide announcements
- Chronological message feed
- Keep members informed of updates and changes

---

## 🛠️ Technology Stack

| Category | Technology |
|----------|-----------|
| **Frontend** | Next.js 15 (App Router), React 19, TypeScript |
| **Styling** | Tailwind CSS |
| **Database** | PostgreSQL (Neon) |
| **ORM** | Prisma |
| **Authentication** | Clerk (Organizations) |
| **Payments** | Stripe Checkout + Webhooks |
| **Hosting** | Netlify |
| **CI/CD** | GitHub Actions |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20 or higher
- PostgreSQL database (recommend [Neon](https://neon.tech) for easy setup)
- [Clerk](https://clerk.com) account with Organizations enabled
- [Stripe](https://stripe.com) account (test mode works fine)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd the-fairway-planner
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` and fill in your credentials:

```env
# Database (get from Neon or your PostgreSQL provider)
DATABASE_URL="postgresql://user:password@host:5432/fairway_planner"

# Clerk (from dashboard.clerk.com)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Stripe (from dashboard.stripe.com)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Database

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

This creates all necessary database tables.

### 4. Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

---

## 📋 Detailed Setup Instructions

### Setting Up Neon (Database)

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project
3. Copy the connection string (it will look like `postgresql://user:password@host.neon.tech/dbname`)
4. Add it to `.env` as `DATABASE_URL`

### Setting Up Clerk (Authentication)

1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. **Important:** Enable Organizations in the settings
4. Go to API Keys and copy:
   - Publishable Key → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Secret Key → `CLERK_SECRET_KEY`

### Setting Up Stripe (Payments)

1. Go to [stripe.com](https://stripe.com) and create an account
2. Use test mode for development
3. Go to Developers → API Keys and copy:
   - Publishable Key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret Key → `STRIPE_SECRET_KEY`

#### Stripe Webhook Setup

**For Development (Optional):**

If you want to test webhooks locally, use the Stripe CLI:

```bash
# Install Stripe CLI (Mac)
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli

# Login and start forwarding
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret from the output to your `.env` file.

**For Production:**

1. Deploy your app to Netlify
2. In Stripe Dashboard → Developers → Webhooks
3. Add endpoint: `https://your-app.netlify.app/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
5. Copy the webhook signing secret to Netlify environment variables

**Note:** Payments work in development without webhooks! The webhook only confirms payment status. You can test the full flow in production or manually update payment status in Prisma Studio for local testing.

---

## 📁 Project Structure

```
fairway-planner/
├── app/
│   ├── api/                    # API Routes
│   │   ├── me/                # User profile endpoints
│   │   ├── trips/             # Trip management
│   │   ├── rounds/            # Round management
│   │   ├── scorecards/        # Score entry and locking
│   │   ├── tee-groups/        # Tee sheet management
│   │   └── stripe/            # Payment processing
│   ├── dashboard/             # Main dashboard page
│   ├── t/[tripId]/            # Trip detail pages
│   │   ├── page.tsx           # Trip home
│   │   ├── admin/             # Trip settings
│   │   └── payments/          # Payment checkout
│   ├── r/[roundId]/           # Round pages
│   │   ├── page.tsx           # Round leaderboard
│   │   └── score/             # Score entry
│   ├── payments/              # Payment success/cancel
│   ├── trip/create/           # Create trip form
│   ├── sign-in/               # Authentication pages
│   ├── layout.tsx             # Root layout with Clerk
│   └── globals.css            # Global styles
├── lib/
│   ├── prisma.ts              # Prisma client singleton
│   ├── permissions.ts         # Role-based access control
│   └── utils.ts               # Utility functions
├── prisma/
│   └── schema.prisma          # Database schema
├── .github/workflows/
│   └── ci.yml                 # GitHub Actions CI/CD
├── netlify.toml               # Netlify config
└── package.json               # Dependencies and scripts
```

---

## 🔌 API Reference

### Authentication
- `POST /api/me/bootstrap` - Create or get user profile

### Trips
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/trips` | Create or update trip |
| `GET` | `/api/trips` | Get current org's trip |
| `GET` | `/api/trips/:tripId` | Get trip details |
| `POST` | `/api/trips/:tripId/itinerary` | Add itinerary item |
| `POST` | `/api/trips/:tripId/cost-items` | Add cost item |
| `POST` | `/api/trips/:tripId/announcements` | Post announcement |
| `PATCH` | `/api/trips/:tripId/rsvp` | Update RSVP status |
| `GET` | `/api/trips/:tripId/leaderboard` | Get trip cumulative leaderboard |

### Rounds & Scoring
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/rounds` | Create round |
| `GET` | `/api/rounds/:roundId` | Get round details |
| `GET` | `/api/rounds/:roundId/leaderboard` | Get round leaderboard |
| `POST` | `/api/tee-groups` | Create tee group |
| `POST` | `/api/scorecards/:scorecardId/holes` | Update hole scores |
| `POST` | `/api/scorecards/:scorecardId/submit` | Submit scorecard |
| `POST` | `/api/scorecards/:scorecardId/lock` | Lock scorecard (organizer) |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/stripe/checkout` | Create checkout session |
| `POST` | `/api/stripe/webhook` | Handle Stripe webhooks |

---

## 👥 User Roles & Permissions

### Organizer (Clerk `org:admin` or `org:owner`)
✅ Create and manage trips
✅ Manage itinerary and cost items
✅ Create rounds and tee sheets
✅ Edit any player's scores
✅ Lock scorecards
✅ Post announcements

### Player (Clerk `org:member`)
✅ View trip details
✅ Update own RSVP status
✅ Make payments
✅ Enter own scores
✅ View leaderboards

---

## 💾 Database Schema

The application uses Prisma with PostgreSQL. Key models include:

| Model | Description |
|-------|-------------|
| `UserProfile` | User accounts linked to Clerk |
| `Trip` | Trip details and handicap settings |
| `TripMember` | Membership with RSVP and handicap |
| `ItineraryItem` | Schedule items (rounds, meals, etc.) |
| `Round` | Golf rounds with course info |
| `TeeGroup` | Tee time groupings |
| `Scorecard` | Player scorecards per round |
| `HoleScore` | Individual hole scores (1-18) |
| `TripCostItem` | Payment items |
| `Payment` | Payment records with Stripe data |
| `Announcement` | Trip announcements |

View the full schema in `prisma/schema.prisma`.

---

## 🧑‍💻 Development

### Available Scripts

```bash
npm run dev              # Start dev server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint
npm run typecheck        # Run TypeScript checks
npm run prisma:generate  # Generate Prisma client
npm run prisma:migrate   # Run database migrations
npm run prisma:studio    # Open Prisma Studio GUI
```

### Working with Prisma

**View and edit data:**
```bash
npm run prisma:studio
```

**Create new migration after schema changes:**
```bash
npx prisma migrate dev --name your_migration_name
```

**Reset database (⚠️ deletes all data):**
```bash
npx prisma migrate reset
```

---

## 🚢 Deployment

### Deploy to Netlify

1. **Push your code to GitHub**

2. **Connect to Netlify:**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Connect to GitHub and select your repository
   - Build settings are already configured in `netlify.toml`

3. **Configure Environment Variables:**

   In Netlify dashboard → Site settings → Environment variables, add:

   ```
   DATABASE_URL
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   NEXT_PUBLIC_CLERK_SIGN_IN_URL
   NEXT_PUBLIC_CLERK_SIGN_UP_URL
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
   STRIPE_SECRET_KEY
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   STRIPE_WEBHOOK_SECRET
   NEXT_PUBLIC_APP_URL
   ```

4. **Deploy!**
   - Netlify will automatically build and deploy
   - Get your production URL: `https://your-app.netlify.app`

5. **Configure Stripe Webhook for Production:**
   - Go to Stripe Dashboard → Webhooks
   - Add endpoint: `https://your-app.netlify.app/api/stripe/webhook`
   - Select events: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`
   - Copy webhook signing secret to Netlify env vars

---

## 🧪 Testing

### Test Cards (Stripe)

Use these cards in test mode:

| Card Number | Description |
|-------------|-------------|
| `4242 4242 4242 4242` | Success |
| `4000 0000 0000 9995` | Decline |

Any future date for expiry, any 3 digits for CVC, any postal code.

### Manual Testing Flow

1. **Create Account & Organization**
   - Sign up at `/sign-up`
   - Create a new organization in Clerk

2. **Create Trip**
   - Go to dashboard
   - Click "Create Trip"
   - Fill in trip details

3. **Add Content** (via API or Prisma Studio)
   - Add itinerary items
   - Create rounds
   - Add cost items

4. **Test Scoring**
   - Go to round page
   - Click "Enter My Score"
   - Enter scores for 18 holes
   - Submit scorecard
   - View leaderboard

5. **Test Payments**
   - Go to Payments page
   - Select cost item
   - Complete checkout with test card
   - Verify status updates

---

## 🐛 Troubleshooting

### Common Issues

**"Module not found" errors**
```bash
rm -rf node_modules package-lock.json .next
npm install
```

**Database connection errors**
- Verify `DATABASE_URL` is correct
- Check database is accessible
- Run `npx prisma migrate dev` to sync schema

**Clerk authentication not working**
- Verify all Clerk env vars are set
- Check Organizations are enabled in Clerk dashboard
- Clear browser cookies and try again

**Stripe webhooks failing**
- For local dev: Make sure Stripe CLI is running
- For production: Verify webhook endpoint URL
- Check `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

**TypeScript errors**
```bash
npm run typecheck
```

**Build fails on Netlify**
- Check environment variables are set
- Review build logs for specific errors
- Verify Node.js version (should be 20+)

---

## 🗺️ Roadmap & Future Features

### Planned Enhancements

- [ ] **Multiple Trips per Organization** - Support for multiple simultaneous trips
- [ ] **Course Database** - Searchable course directory with ratings, slopes, and yardages
- [ ] **Alternative Scoring Formats** - Stableford, Match Play, Scramble, Best Ball
- [ ] **Tournament Formats** - Ryder Cup, team competitions, flights
- [ ] **Side Games** - Skins, CTP, long drive, birdies
- [ ] **Photo Gallery** - Trip photo sharing and albums
- [ ] **PDF Exports** - Printable tee sheets, scorecards, and leaderboards
- [ ] **GHIN Integration** - Official handicap lookup and posting
- [ ] **Email Notifications** - Automated emails for announcements and reminders
- [ ] **Mobile App** - Native iOS and Android apps
- [ ] **Offline Mode** - Score entry without internet connection
- [ ] **Stats Tracking** - GIR, fairways, putts, scoring average
- [ ] **Weather Integration** - Course weather forecasts
- [ ] **Tee Time Booking** - Integration with tee time booking APIs

---

## 📄 License

Private - All rights reserved

---

## 🤝 Contributing

This is currently a private project. For questions or suggestions, please open an issue.

---

## 📧 Support

For bugs, feature requests, or questions:
- Open an issue on GitHub
- Contact: [your-email@example.com]

---

**Built with ❤️ for golf trip organizers everywhere**
