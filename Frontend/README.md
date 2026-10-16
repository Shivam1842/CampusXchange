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

- `/` — public landing page shell
- `/login` and `/register` — authentication shells
- `/student/dashboard` — activity overview, skills, partner recommendations, and application status
- `/student/profile` — student details, skills, certifications, and portfolio
- `/student/partners` — searchable learning partner directory
- `/student/teams` — team creation, invitations, and active roster
- `/student/projects` — searchable and filterable project marketplace
- `/student/projects/:id` — project details and application form
- `/client/post-project` and `/client/applications` — client workspace
- `/workspace/:projectId` — shared collaboration workspace
- `/admin/dashboard` — administration workspace

Student, client, and admin sections have responsive shared navigation and sidebar layouts. Student screens use local mock data and client-side interactions until backend services are connected.
