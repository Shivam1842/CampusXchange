# CampusXchange

CampusXchange connects students, project clients, and administrators through skill discovery, team formation, project applications, shared workspaces, reviews, and notifications.

## Requirements

- Node.js 20 or newer
- MongoDB Atlas or a MongoDB replica set (Atlas is required to exercise transaction-backed applicant selection)
- Cloudinary credentials for profile photos and verification documents
- Resend credentials for password reset and email-verification delivery
- Google OAuth web client ID for Google sign-in

## Local setup

1. Copy `Backend/.env.example` to `Backend/.env` and fill in `MONGODB_URI` and a random `JWT_SECRET` of at least 32 bytes. Keep `.env` private; `.gitignore` excludes it.
2. Install and start the API:

   ```sh
   cd Backend
   npm install
   npm run dev
   ```

3. In another terminal, copy `Frontend/.env.example` to `Frontend/.env`, set `VITE_API_BASE_URL` to the backend API URL, and set `VITE_GOOGLE_CLIENT_ID` if using Google sign-in.
4. Install and start the web app:

   ```sh
   cd Frontend
   npm install
   npm run dev
   ```

The API defaults to `http://localhost:5000`; Vite defaults to `http://localhost:5173`. Configure `CLIENT_URL` to the web app origin. MongoDB connection configuration is loaded from `Backend/.env`.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | Yes | Atlas or replica-set connection string |
| `JWT_SECRET` | Yes | Signs API session tokens; rotate it to invalidate existing sessions |
| `JWT_EXPIRES_IN` | No | JWT lifetime (defaults to the package default) |
| `PORT` | No | API port (defaults to 5000) |
| `CLIENT_URL` | No | CORS origin and account email link origin |
| `RESEND_API_KEY`, `EMAIL_FROM` | For email | Sends reset and verification links using Resend |
| `EMAIL_VERIFICATION_REQUIRED` | No | Set to `true` if the deployment should gate login on email verification |
| `GOOGLE_CLIENT_ID` | For Google auth | Validates Google ID tokens on the API |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | For uploads | Signs profile-photo and authenticated verification-document uploads; the secret stays on the API |
| `VITE_API_BASE_URL` | No | Frontend API base (defaults to `http://localhost:5000/api/v1`) |
| `VITE_GOOGLE_CLIENT_ID` | For Google auth | Loads Google's sign-in button in the frontend |

Email delivery and cloud uploads are disabled until their provider credentials are supplied. Google sign-in requires matching client IDs in frontend and backend configuration. Never commit real credentials or include `.env` or server logs in a submission archive.

## Main routes

### Web screens

| Role | Screens |
| --- | --- |
| Public | `/`, `/login`, `/register`, `/verify-email`, `/reset-password` |
| Student | `/student/dashboard`, `/student/profile`, `/student/partners`, `/student/skill-requests`, `/student/teams`, `/student/projects`, `/student/projects/:id`, `/student/applications`, `/student/notifications`, `/student/messages`, `/student/verification` |
| Client | `/client/post-project`, `/client/profile`, `/client/projects`, `/client/applications`, `/client/notifications`, `/client/messages`, `/client/verification` |
| Shared | `/workspace/:projectId` |
| Admin | `/admin/dashboard` |

### API route groups

API prefix: `/api/v1`. Authentication is required on private endpoints; admin routes require the admin role.

| Route group | Main operations |
| --- | --- |
| `/auth` | Register/login, current user, logout/change password, password reset, email verification, Google sign-in |
| `/profiles` | Current profile read/update, partner discovery and filters, avatar upload signing/persistence |
| `/projects` | Project discovery/creation/update, applications, project workspace/tasks/messages |
| `/applications` | Student application listing, client review and selection |
| `/teams` | Team discovery, creation, membership, invitations and status |
| `/skill-requests` | Send, list, accept and reject peer skill requests |
| `/matching`, `/students`, `/dashboard` | Partner recommendations, student data, role dashboards |
| `/messages` | Direct conversation start/list, message history and sending/read state |
| `/verification-documents` | Upload signing, own submissions and document submission |
| `/notifications` | List and mark notifications read |
| `/reviews`, `/reports` | Review and report actions |
| `/admin` | Metrics, users, projects, reports, audit history, verification-document review |

## Verification

Run the backend test suite and frontend checks:

```sh
cd Backend && npm test
cd ../Frontend && npm run lint && npm run build
```

See [the PRD traceability and coverage table](docs/PRD-TRACEABILITY.md). Real Atlas journeys require an accessible Atlas cluster and working admin account; the workspace environment must be able to reach the configured cluster.
