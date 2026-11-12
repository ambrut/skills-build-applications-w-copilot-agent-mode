# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

Record your plan here before editing code.

- Presentation tier decision: Each page uses the `useApiResource` hook, which calls the shared `src/api/client.ts`. `CapabilityCard` renders loading (`role="status"`), error (`role="alert"`), empty, and list states. The workouts page requests suggestions for the seeded demo user `mona@example.com` because there is no authentication.
- Logic tier decision: Business behavior and input validation live in explicit functions in `services/octofitService.ts`. Routes only delegate and forward errors. Invalid input returns a deliberate 4xx (400 for malformed input, 404 for unknown users or teams).
- Data tier decision: Mongoose schemas enforce required fields and minimums (`minutes >= 1`, `points >= 0`). Seeding stays idempotent and upsert-based.
- Activity tracking approach: `POST /api/activities` checks that `type` is non-empty, `minutes` is a positive number, and `userId`/`teamId` are well-formed 24-hex IDs for an existing user and team. It stores `points` equal to `minutes` (matching the seed data) and sets `occurredAt` to the current time.
- Team management approach: `POST /api/teams` validates the schema (name and mascot required, otherwise 400) and that each member ID is well-formed. It does not check that members exist, and it does not update their `team` field.
- Leaderboard approach: Sum `points` per team with an aggregation, join team names, and sort by total descending (ties by team name). Then assign a 1-based `rank`.
- Workout suggestions approach: Look up the user by email (404 if none). Derive the focus from the most common type among their last 10 activities, with run, cycle, swim, walk, and row mapped to "endurance". Fall back to `fitnessGoal` when there is no activity. List matching workouts first, each with a `reason`.

## Test plan

Record the commands you run and what each failure means.

- Data-tier command: `npm run test:data --prefix octofit-tracker/backend`
- API command: `npm run test:api --prefix octofit-tracker/backend`
- Frontend command: `npm test --prefix octofit-tracker/frontend`
- Backend build command: `npm run build --prefix octofit-tracker/backend`
- Frontend build command: `npm run build --prefix octofit-tracker/frontend`
