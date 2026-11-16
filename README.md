# SnackRank

SnackRank is a small convenience-store review and rewards app built with Next.js.

## Stack
- Next.js 14
- React 18
- TypeScript
- Prisma ORM
- PostgreSQL
- Vercel + Supabase recommended for deployment

## Local development

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env` and fill in values.
3. Configure `ADMIN_EMAILS` with comma-separated administrator email addresses.
4. Generate the Prisma client:
   npx prisma generate
5. Apply the additive database migration:
   npx prisma migrate deploy
6. Start the app:
   npm run dev

The migration adds database-backed raffle and reward activities and seeds the
existing sample activities. It does not delete or rebuild existing tables.
Administrators can create, edit, activate, deactivate, and schedule activities
at `/admin/activities`. The home page counts members and reviews from the
database (including retained legacy JSON records, deduplicated by ID), and
counts activities that are enabled and within their schedule.

## Production deployment recommendation

- Frontend: Vercel
- Database: Supabase PostgreSQL
- Session secret: configure in Vercel environment variables

Apply Prisma migrations as part of deployment before starting the application.
