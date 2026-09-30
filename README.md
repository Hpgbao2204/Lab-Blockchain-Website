# Blockchainist Web

Next.js App Router base for the Blockchainist academic research group website.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS v4 with shadcn-compatible component structure
- Firebase Auth and Firestore
- Firebase Admin SDK in Next.js Route Handlers
- Vercel target deployment

## Local Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill `.env.local` with the values in `.env.example`. Firebase Web SDK values are used only for `/admin` login; Firebase Admin service account values stay server-only and are used by route handlers and public server rendering.

## Firebase Setup

1. In Firebase Console, create the Native Firestore database in `asia-southeast1`.
2. Register the Firebase Web app, enable Email/Password Authentication, authorize `localhost` and `blockchainist.id.vn`, then create and verify `admin.blockchainist.uit@gmail.com`.
3. Deploy `firestore.rules`; the rules intentionally deny every browser read/write. Next.js uses Firebase Admin SDK on Vercel for all Firestore access.
4. Register an ORCID Public API client owned by the project team and add `ORCID_CLIENT_ID` and `ORCID_CLIENT_SECRET` as Vercel server secrets.
5. Create a Cloudflare Turnstile widget for `blockchainist.id.vn` (and localhost for development) and add its site/secret keys. Contact applications are rejected until Turnstile is configured.

Set the complete environment set in Vercel Development, Preview, and Production. Keep `FIREBASE_PRIVATE_KEY`, `ORCID_CLIENT_SECRET`, and `TURNSTILE_SECRET_KEY` server-only.

## Scripts

```bash
npm run test
npm run typecheck
npm run lint
npm run build
```

## Routes

- `/` homepage MVP
- `/publications`
- `/members`
- `/projects`
- `/join`
- `/contact`
- `/admin`

## API

- `GET /api/publications`
- `GET /api/members`
- `GET /api/projects`
- `POST /api/applications`
- `GET|POST /api/admin/{members|publications|projects}`
- `PATCH|DELETE /api/admin/{members|publications|projects}/{id}`
- `GET /api/admin/applications`; `PATCH|DELETE /api/admin/applications/{id}`
- `GET|PATCH /api/admin/settings`
- `POST /api/admin/orcid/sync`

## Firebase Data Notes

The new app uses `projects` only and does not read the legacy `research` collection. Public content routes return empty arrays when Firebase Admin is not configured, so the app can build and render locally before Firebase setup. Publications are public only when `isPublished` is true, and members only when `isActive` is true.
