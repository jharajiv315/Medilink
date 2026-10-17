# MediLink

Patient-controlled medical record sharing and clinical handoff.

MediLink brings medical history, documented discrepancies, and sharing permissions into one workspace. Patients manage their records and decide which categories a clinician can access. Doctors request access, review authorized evidence, and document reconciliations with a supporting rationale.

**[Open the application](https://medilink-wheat-two.vercel.app/)** · [Supabase operations guide](docs/SUPABASE.md) · [Report an issue](https://github.com/jharajiv315/Medilink/issues)

> MediLink is a demonstration application with synthetic clinical examples. It does not provide medical advice or establish HIPAA, SOC 2, or FHIR conformance certification.

## Product snapshots

The current interface uses MediLink’s botanical Bulbasaur theme: pale sage surfaces, forest-green navigation, rounded clinical cards, botanical accents, and responsive layouts. These snapshots are captured from the verified local build at the same responsive viewports used for the live workflow checks.

| Patient dashboard | Clinical handoff |
| --- | --- |
| ![Patient dashboard desktop](docs/snapshots/patient-dashboard-desktop.png) | ![Clinical handoff desktop](docs/snapshots/clinical-handoff-desktop.png) |

| Patient dashboard on mobile | Support assistant on mobile |
| --- | --- |
| ![Patient dashboard mobile](docs/snapshots/patient-dashboard-mobile.png) | ![MediLink support assistant](docs/snapshots/support-chat-mobile.png) |

The [medical history mobile snapshot](docs/snapshots/medical-history-mobile.png) shows the responsive timeline, provider and record filters, provenance cards, and source fingerprints. The support assistant is a product-navigation helper: it does not access medical records or provide medical advice. It uses seeded MediLink guidance by default and can optionally call Gemini through the server when `GEMINI_API_KEY` is configured.

## Features

### Patient workspace

- Register and sign in to a private patient account.
- View a health overview and searchable medical history timeline.
- Import clinical text with document metadata and source references.
- Review documented allergy and medication discrepancies and add patient statements.
- Approve requested record categories for a limited period or revoke access.
- Share a handoff URL or display its QR code for the assigned clinician.
- Review account-scoped access and consent audit events.
- Ask the MediLink assistant for product navigation help from the floating **Ask MediLink** button.

### Clinical workspace

- Sign in with an administrator-provisioned doctor account.
- Request patient records by patient code, purpose, categories, and duration.
- View active handoffs and pending requests.
- Open records through an active, authorized grant.
- Compare source evidence and record a determination and rationale for each discrepancy.

### Administration and persistence

- Provision clinician accounts for existing organizations.
- Enforce patient, clinician, and administrator permissions on the backend.
- Persist accounts, password hashes, sessions, records, consent, and reviews in Supabase Postgres.
- Commit database changes before returning successful API responses.
- Preserve local JSON storage for isolated development and tests.

## Core workflow

1. A patient registers or signs in and imports clinical information.
2. A doctor requests specific record categories for a stated purpose.
3. The patient reviews the request, selects permitted categories, and sets an access duration.
4. The doctor signs in and opens the authorized handoff, directly or through its QR link.
5. The doctor reviews discrepancies and records their determination and supporting notes.
6. The patient can revoke the grant; subsequent handoff requests are denied. Expired grants are also denied.

A QR code contains a handoff URL. Scanning it does not bypass authentication, grant ownership checks, category restrictions, or expiry.

## Technology

| Layer | Implementation |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 8 |
| Styling | Tailwind CSS 4, shared UI components, Lucide icons |
| Backend | Express 4 on Node.js 24 |
| Database | Supabase Postgres through the Supavisor transaction pooler |
| Database client | Postgres.js, pinned in the lockfile |
| Authentication | Application-managed credentials and server-side sessions |
| Deployment | Vercel static frontend and Node.js API function |
| Tests | Node.js test runner and TypeScript checks |

Supabase provides database persistence. Authentication remains managed by the Express application; this project does **not** use Supabase Auth for its patient and doctor login flows.

## Architecture

```text
React application
    |
    | Same-origin /api requests and HttpOnly session cookie
    v
Express API
    |-- Session authentication and role checks
    |-- Patient ownership and clinical grant authorization
    |-- Consent filtering and discrepancy processing
    |
    v
Request-isolated storage adapter
    |-- Supabase: transaction, write lock, commit before response
    `-- Local development: JSON file
    |
    v
Supabase Postgres / medilink schema
```

The current persistence adapter stores the existing application record structure in a JSONB row. Mutations acquire a row lock to prevent lost updates across server instances. Read-only requests avoid that lock, and normal requests append audit events without transferring the full historical audit log.

This compatibility design supports the current demonstration workload. A larger deployment should normalize records and identity entities, introduce pagination, and use narrower queries and transactions. See [Supabase persistence](docs/SUPABASE.md) for migration, permissions, and recovery details.

## Local setup

### Prerequisites

- Node.js **24.x**, matching the deployed runtime.
- npm, included with Node.js.
- Git.
- A configured Supabase database only when using managed persistence locally.

### 1. Clone and install

```bash
git clone https://github.com/jharajiv315/Medilink.git
cd Medilink
npm ci
```

### 2. Configure the environment

Copy `.env.example` to `.env` and set the variables for your chosen storage mode.

```bash
# macOS / Linux
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

For isolated local development, leave `SUPABASE_DATABASE_URL` empty and set a database file outside the repository:

```dotenv
MEDILINK_DB_PATH=../medilink-local/store.json
```

The backend creates synthetic seed data when this file does not exist. Set unique seed-account passwords if you need to sign in as the demonstration patient, doctor, or administrator. Without those passwords, new patients can still register.

For managed persistence, follow [the Supabase operations guide](docs/SUPABASE.md) to initialize the schema and import the data, then configure the restricted runtime connection:

```dotenv
SUPABASE_DATABASE_URL=postgresql://medilink_runtime.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres
```

Use the actual transaction-pooler hostname for your project. Do not commit a populated connection URL or use a production database for routine local tests.

### 3. Start the application

```bash
npm run dev
```

Open **http://localhost:3002**. The Express development server serves both the frontend through Vite middleware and the API; a separate frontend process is not required.

On Windows, use `npm.cmd` if PowerShell blocks `npm.ps1`.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `SUPABASE_DATABASE_URL` | Server-only restricted Postgres connection for persistent storage. Required for the deployed Supabase configuration. |
| `MEDILINK_DB_PATH` | Optional local JSON path. Use an isolated path outside the repository for development. |
| `DEMO_PATIENT_PASSWORD` | Optional password for the seeded patient account. Minimum 12 characters. |
| `CLINICIAN_PASSWORD` | Optional password for the seeded doctor account. Minimum 12 characters. |
| `ADMIN_PASSWORD` | Optional password for the seeded administrator account. Minimum 12 characters. |
| `PORT` | Local server port; defaults to `3002`. |
| `NODE_ENV` | Set to `production` when serving the built frontend locally. |
| `DISABLE_HMR` | Set to `true` to disable development hot reload and file watching. |
| `GEMINI_API_KEY` | Optional server-only Gemini key for assistant questions outside the built-in product guide. Never expose it as `VITE_GEMINI_API_KEY`. |
| `GEMINI_CHAT_MODEL` | Optional Gemini model name; defaults to `gemini-2.5-flash`. |

`DEMO_CLINICIAN_PASSWORD`, `DEMO_CLINICIAN_SESSION_SECRET`, and `DEMO_CLINICIAN_EXPIRES_AT` support a legacy temporary demonstration mode. They are not needed for normal Supabase-backed doctor sessions.

`GEMINI_API_KEY` is optional and is used only by `POST /api/chat` after the user explicitly enables AI responses in the assistant. The route has input limits, rate limiting, a product-only system instruction, and a seeded fallback response when Gemini is unavailable. Do not place patient medical details in chat.

Keep populated environment files, database URLs, account passwords, and backups private. Never prefix a server secret with `VITE_`, because Vite exposes such variables to the browser.

## Accounts and access

| Role | How access is obtained | Main destination |
| --- | --- | --- |
| Patient | Public patient registration or an existing account | `/patient/dashboard` |
| Clinician | Account provisioned by an administrator | `/clinic/dashboard` |
| Administrator | Existing provisioned administrator account | `/admin/clinicians` |

Patients use the **Patient Sign In** tab. Doctors and administrators use **Clinical Team**. Doctor self-registration and role switching are not available.

Demo credentials are distributed privately and are not published in this repository. An administrator can provision additional clinicians after signing in.

## Commands and verification

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the combined development frontend and backend. |
| `npm run lint` | Run TypeScript checks; this command does not run ESLint. |
| `npm test` | Run engine, API, and persistence-adapter tests. |
| `npm run build` | Build the frontend into `dist/`. |
| `npm run start` | Start Express; use `NODE_ENV=production` to serve the built frontend. |
| `npm run preview` | Preview the Vite build only; it does not start the Express API. |
| `node --env-file=.env.supabase.local scripts/verify-live-demo.mjs <API_BASE_URL>` | Run the authenticated two-device workflow check against a designated environment. The full run includes real grant expiry and creates/removes only its own synthetic fixture records. |

Run the standard checks before opening a pull request:

```bash
npm run lint
npm test
npm run build
```

Tests cover discrepancy classification, reconciliation preservation, consent expiry and revocation, authorization boundaries, import deduplication, database commit ordering, rollback behavior, and audit preservation. API tests use an isolated temporary JSON database.

The Supabase workflow verification script is an **integration test that writes synthetic records**. Run it only against an explicitly designated environment:

```bash
node --env-file=.env.supabase.local scripts/verify-supabase.mjs <API_BASE_URL_A> <API_BASE_URL_B>
```

It requires the database connection and administrator password. Two API instances can be supplied to verify shared persistence. The script removes only the synthetic accounts and clinical records it creates; it retains their audit events.

## Deployment

The repository is configured for Vercel:

- Vite produces the static frontend.
- `api/index.ts` adapts API requests to Express.
- `vercel.json` routes `/api/*` to the API function and supports frontend deep links.
- The backend executes in Mumbai (`bom1`), near the Supabase database.
- Production environment variables are configured separately in Vercel.

Configure `SUPABASE_DATABASE_URL` as a server-only secret before deploying. Configure any required seed-account passwords separately. A Vercel deployment without a persistent connection fails closed unless an explicit local/test file path was supplied.

After deployment, check:

```text
GET /api/health
```

The Supabase-backed deployment reports:

```json
{
  "status": "healthy",
  "service": "MediLink Continuity Core",
  "version": "1.0.0",
  "storage": "supabase"
}
```

Then verify login, refresh on a protected route, consent approval and revocation, and logout. A frontend build alone does not verify the database or authentication configuration.

## Repository structure

```text
api/index.ts                 Vercel API adapter
server.ts                    Express routes and authentication
src/components/              Navigation, footer, and shared UI components
src/context/                 Client authentication state
src/pages/                   Landing, authentication, patient, doctor, and admin screens
src/server/                  Storage adapters, TLS configuration, and API tests
src/types/                   Application data contracts
src/utils/                   Consent and discrepancy engines with tests
scripts/                     Migration preparation, import, and integration verification
supabase/migrations/         Database schema and runtime-role permissions
docs/SUPABASE.md             Database operations and recovery guide
data/medilink_store.json      Synthetic local seed/demo dataset
vercel.json                  Production routing and function region
```

## Security and current scope

- Passwords are stored as salted scrypt hashes; normal sessions use opaque tokens whose hashes are stored server-side.
- Session cookies are HttpOnly, SameSite=Strict, and Secure in production.
- The API checks account roles, patient ownership, clinical grant assignment, permitted categories, and grant status.
- The Supabase runtime role has limited access to MediLink's storage. Anonymous clients have no direct clinical-data access.
- Database connections verify TLS certificates using Supabase's public root CA.
- Imported clinical text receives a SHA-256 content fingerprint for provenance and duplicate detection.
- Audit events record actions and outcomes. The current implementation is **not** a cryptographically chained or externally immutable audit ledger.
- Import currently accepts clinical text and metadata. It does not implement live Epic/Cerner connections, PDF OCR, or a general FHIR server.
- Discrepancy detection is deterministic and limited to the implemented rules. It does not independently establish a diagnosis or recommend treatment.
- QR images are generated locally in the browser. The URL still requires the assigned clinician's authenticated access.

## Contributing

Open an issue describing the affected workflow, expected behavior, and reproduction steps. Keep pull requests focused, preserve authorization boundaries, and run the standard checks before submitting. Never include real patient information, credentials, or private database exports in an issue or pull request.

No `LICENSE` file is currently included in this repository; this README does not grant an open-source license.
