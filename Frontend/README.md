# CampusXchange frontend

React application built with Vite, React Router, and Tailwind CSS.

## Development

From this directory, run:

```sh
npm install
npm run dev
```

`npm run build` creates a production build, and `npm run lint` runs ESLint.

## Application routes

- `/` — public landing page with onboarding steps and platform statistics
- `/login` and `/register` — student and business authentication forms
- `/student/dashboard` — activity overview, skills, partner recommendations, and application status
- `/student/profile` — student details, skills, certifications, and portfolio
- `/student/partners` — searchable learning partner directory
- `/student/teams` — team creation, invitations, and active roster
- `/student/projects` — searchable and filterable project marketplace
- `/student/projects/:id` — project details and application form
- `/client/post-project` — project creation form with a live preview
- `/client/applications` — applicant review and comparison
- `/workspace/:projectId` — shared task tracker and team/client chat
- `/admin/dashboard` — platform metrics, registrations chart, and review queue

Student, client, and admin sections have responsive shared navigation and sidebar layouts. All flows use local mock data and client-side interactions until backend services are connected. Authentication and Google sign-in are interface-only and do not create or authenticate accounts.
