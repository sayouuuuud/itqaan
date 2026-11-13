<div align="center">
  <img src="public/branding/main-logo.png" alt="Itqaan logo" width="140" />

  <h1>Itqaan · إتقان</h1>

  <p><strong>Quran recitation review, guided correction, and learning management.</strong></p>

  <p>
    An Arabic-first platform connecting students with Quran readers<br />
    through recorded recitations, structured feedback, and scheduled sessions.
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js-16-000000?logo=nextdotjs" alt="Next.js 16" />
    <img src="https://img.shields.io/badge/React-19-149ECA?logo=react" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5.7" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" alt="Tailwind CSS 4" />
  </p>

  <p>
    <a href="#overview">Overview</a> ·
    <a href="#features">Features</a> ·
    <a href="#student-journey">Student journey</a> ·
    <a href="#getting-started">Getting started</a> ·
    <a href="#project-structure">Project structure</a>
  </p>
</div>

---

## Overview

Itqaan brings the recitation learning cycle into one application: students record their recitation, readers review it, and the platform coordinates the next step—recognition of mastery or a correction session.

The current experience focuses on **Surah Al-Fatiha**. Dedicated workspaces support students, readers, administrators, supervisors, and initiative organizers. Arabic and English translations, an RTL-first layout, and light and dark themes support the interface.

## Features

| Area | Capabilities |
| --- | --- |
| **Student workspace** | Browser audio recording, submission tracking, review feedback, session booking, messaging, and certificate requests. |
| **Reader workspace** | Assigned recitations, assessment scores, written feedback, word-level mistakes, availability management, and session follow-up. |
| **Administration** | Reader applications, user management, recitation assignment, bookings, certificate issuance, announcements, and reports. |
| **Initiatives** | Organization requests and approval, dedicated organizers, participant management, CSV import, email invitations, and join codes. |
| **Certificates** | Personalized PNG generation, PDF generation and download, serial numbers, and dedicated certificate pages. |
| **Communication** | Student–reader conversations, in-app notifications, email templates, verification emails, and session reminder endpoints. |
| **Operations** | Activity logs, visitor analytics, homepage and SEO settings, SMTP settings, and JSON backup/import tools. |

### Audio designed for browser differences

The current recorder uses `MediaRecorder`, prefers MP4 where supported, and converts WebM recordings to WAV in the browser when possible. Recordings upload directly to UploadThing, keeping the main application server out of the audio transfer path.

Recording is limited to **three minutes** in the current recorder. The UploadThing audio route accepts one file up to **32 MB**. Microphone access requires HTTPS or localhost and browser permission.

## Student journey

```mermaid
flowchart TD
    A["Register and verify email"] --> B["Record and submit recitation"]
    B --> C["Reader reviews assigned recitation"]
    C --> D{"Assessment"}
    D -->|Mastered| E["Submit certificate details"]
    E --> F["Admin issues certificate"]
    D -->|Needs session| G["Book correction session"]
    G --> H["Reader confirms and follows up"]
```

Readers provide the assessment. The platform records scores, feedback, and mistakes, then helps students act on the result. Session meeting links are supplied by a reader or administrator; conferencing takes place through the supplied external link.

## Roles and workspaces

| Role | Main workspace | Purpose |
| --- | --- | --- |
| `student` | `/student` | Submit recitations and follow learning progress. |
| `reader` | `/reader` | Review recitations and manage teaching sessions. |
| `admin` | `/admin` | Manage platform content, users, and operations. |
| `student_supervisor` | `/admin` | Student supervision within the shared administrative area. |
| `reciter_supervisor` | `/admin` | Reader supervision within the shared administrative area. |
| `initiative_admin` | `/initiative` | Manage an initiative and its participants. |

Students and readers sign in through `/login`. Administrative roles use `/login-admin`; the login context affects the active role.

## Technology

| Layer | Implementation |
| --- | --- |
| Application | Next.js 16 App Router, React 19, TypeScript |
| Interface | Tailwind CSS 4, Radix UI components, Lucide icons, next-themes |
| Data | PostgreSQL through `pg`; Supabase SDK helper for additional integrations |
| Authentication | Application-managed JWT cookies with `jose`; password hashing with `bcryptjs` |
| File storage | UploadThing |
| Email | Nodemailer with database-managed SMTP settings or an environment fallback |
| Certificates | Sharp and text-to-svg for images; Puppeteer/Chromium for PDFs |
| Audio | Browser MediaRecorder and Web Audio APIs; FFmpeg utilities for server-side conversion tasks |
| Client data and charts | SWR and Recharts |

The main application queries PostgreSQL directly. Authentication is implemented by the application rather than Supabase Auth, and active file uploads use UploadThing.

## Getting started

### Prerequisites

- Node.js **20.9 or later**, as required by the locked Next.js version, and npm.
- A PostgreSQL database with the application schema and applicable migrations.
- UploadThing credentials for uploads and generated certificate storage.
- An SMTP account for verification, password recovery, and notification delivery.
- A host capable of running Node.js and the native dependencies needed by certificate generation.

### 1. Install dependencies

```bash
git clone https://github.com/sayouuuuud/itqaan.git
cd itqaan
npm ci
```

### 2. Configure the environment

Create `.env.local` in the project root:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_SECRET
UPLOADTHING_TOKEN=REPLACE_WITH_YOUR_UPLOADTHING_TOKEN
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Fallback when SMTP is not configured in the admin settings:
SMTP_CONNECTION_URL=smtps://USER:PASSWORD@SMTP_HOST:465

# Used by the Supabase SDK helper and related diagnostic scripts:
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=REPLACE_WITH_YOUR_SERVER_ONLY_KEY
```

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection used by the main application. |
| `JWT_SECRET` | JWT signing and verification. Set your own value instead of relying on the development fallback. |
| `UPLOADTHING_TOKEN` | UploadThing uploads, file deletion, and generated file storage. |
| `NEXT_PUBLIC_APP_URL` | Canonical application URL used in links; set it to the deployed HTTPS origin in production. |
| `SMTP_CONNECTION_URL` | SMTP fallback. A complete `smtp_config` in database settings takes precedence. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for code paths using the SDK helper. |
| `SUPABASE_SERVICE_ROLE_KEY` | Privileged server-only key for those SDK paths; never prefix this key with `NEXT_PUBLIC_`. |

Keep real credentials out of committed files. Without SMTP, the email helper logs message content instead of delivering it.

### 3. Prepare the database

The repository contains a **historical collection of SQL and JavaScript migrations**, rather than a single verified fresh-install command:

- [001-schema.sql](scripts/001-schema.sql) defines the original schema.
- [002-seed.sql](scripts/002-seed.sql) contains optional development fixtures and shared sample credentials.
- Later SQL files and `migrate-*.js` scripts contain changes for recitations, certificates, messaging, reporting, and initiatives.

Review the migrations against your target schema before applying them to a new database. Do not execute every script in bulk: some are one-off maintenance tools, and some historical JavaScript scripts contain fixed database connections that must be replaced before use.

For an existing installation, use its current schema and apply only missing changes. A connection URL alone does not initialize the database.

### 4. Start development

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

Without `DATABASE_URL`, parts of the application use mock or empty data and middleware skips dashboard authentication. This behavior is intended for previewing the interface; it is not a complete working installation.

## Available commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Next.js development server. |
| `npm run build` | Create a production build. |
| `npm start` | Serve a previously built application with Next.js. |
| `npm run hostinger` | Run the custom production Node.js server in `server.js` on a compatible Unix-like host. |
| `npm run lint` | Invoke ESLint; the current manifest does not declare ESLint as a direct dependency or include its configuration. |

For production, configure environment variables through the host, build the application, and start it with the command appropriate to that host:

```bash
npm run build
npm start
```

The custom `server.js` entry point adds a `/health` endpoint, process-local request limiting, startup diagnostics, and shutdown handling. Those behaviors apply when using that entry point.

### Runtime considerations

- Preserve `public/Certificate.png` and `lib/fonts/` when packaging the application; image certificate generation reads them from disk.
- PDF generation uses Puppeteer locally and on non-Vercel hosts, with a separate Chromium path for Vercel. Ensure the chosen host includes the required browser runtime and system libraries.
- The repository includes `/api/cron/reminders` and `/api/cron/check-expirations`. Automatic execution requires an external scheduler configured for the deployment.
- `next.config.mjs` currently permits builds with TypeScript errors. Run `npx tsc --noEmit` separately when validating changes.
- No `npm test` command or comprehensive automated test suite is configured. Build success alone does not verify database, email, upload, or certificate workflows.

## Project structure

| Path | Contents |
| --- | --- |
| `app/(public)/` | Landing page and public information pages. |
| `app/(auth)/` | Registration, login, email verification, and password recovery. |
| `app/student/`, `app/reader/` | Student and reader workspaces. |
| `app/admin/`, `app/initiative/` | Administration and initiative management. |
| `app/api/` | Route handlers for the application workflows. |
| `components/` | Shared interface components, audio recorder/player, and dashboard components. |
| `lib/` | Database access, authentication, email, storage, certificate generation, and translations. |
| `scripts/` | SQL migrations, seed data, and maintenance utilities. |
| `public/` | Branding, certificate template, and other static assets. |
| `server.js` | Optional custom production server. |

## Further reading

- [Student journey and role guide — Arabic](itqaan_journey.md)
- [The story behind Itqaan — Arabic](itqaan_story.md)

These documents provide project background. For current implementation details, follow the relevant route handlers and components.

## License

No license file is currently included in this repository. Obtain the owner's permission before reusing or redistributing the code.
