# CampusXchange PRD traceability

This matrix follows the supplied `CampusXchange_PRD (2).pdf`. “Automated evidence” identifies the closest existing backend test file; presence of a test file does not by itself prove every acceptance criterion. The application uses REST for chat, so real-time delivery is not claimed. Provider-backed actions and Atlas transaction journeys remain deployment checks.

## Functional requirements

| PRD | Requirement | Screen | API | Automated evidence / status |
| --- | --- | --- | --- | --- |
| FR-01 | Register user accounts | `/register` | `POST /api/v1/auth/register` | `authController.test.js`; registered roles and validation covered |
| FR-02 | Authenticate users; logout and password management. Google sign-in, password reset and email verification are optional PRD additions. | `/login`, `/settings/security`, `/verify-email`, `/reset-password` | `/api/v1/auth/login`, `/logout`, `/change-password`, `/forgot-password`, `/reset-password`, `/verify-email`, `/google` | `authController.test.js`, `nfrCoverage.test.js`; external email/Google provider execution needs credentials |
| FR-03 | Student profile with photo, college, course/year, bio, skills and wanted skills, experience, certifications, projects, links and availability | `/student/profile` | `GET/PUT /api/v1/profiles/me`, `/avatar-upload`, `/avatar` | `profileController.test.js`, `cloudinary.test.js`; student field persistence is tested; live image upload needs Cloudinary |
| FR-04 | Add, remove and update skills, proficiency and wanted skills | `/student/profile` | `PUT /api/v1/profiles/me` | `profileController.test.js`; save/reload tests cover listed student and client field groups |
| FR-05 | Find learning partners by compatible offered and wanted skills | `/student/partners` | `GET /api/v1/profiles/partners` | `profileController.test.js`; mutual matching covered |
| FR-06 | Find project teammates by skills, experience, interests, availability and project requirements | `/student/partners` | `GET /api/v1/profiles/partners` | `profileController.test.js`; listed filter combination covered |
| FR-07 | Create teams; invite, accept/reject invitations and manage members | `/student/teams` | `/api/v1/teams`, `/api/v1/teams/:teamId/invitations` | `teamController.test.js`; search-based invite selection is not fully evidenced by a UI interaction test |
| FR-08 | Browse project details | `/student/projects`, `/student/projects/:id` | `GET /api/v1/projects`, `GET /api/v1/projects/:projectId` | `projectController.test.js`, `projectValidation.test.js` |
| FR-09 | Clients post projects | `/client/post-project`, `/client/projects` | `POST/GET /api/v1/projects` | `projectController.test.js`, `projectValidation.test.js` |
| FR-10 | Apply individually or as a team with message, skills, prior projects, links and availability | `/student/projects/:id`, `/student/applications` | `POST /api/v1/projects/:projectId/apply` | `applicationController.test.js`, `applicationValidation.test.js`, `applicationModel.test.js`; persisted fields and team ownership validation implemented |
| FR-11 | Clients review, compare, shortlist, reject and select applicants | `/client/applications` | `/api/v1/projects/:projectId/applications`, `/api/v1/applications/:applicationId/status` | `applicationController.test.js`; status transitions and selection capacity tested |
| FR-12 | Workspace tracks status, tasks, deadline, progress, team and requirements | `/workspace/:projectId` | `/api/v1/projects/:projectId/tasks`, `/progress`, `/participants`, `/messages` | Workspace UI/API implemented; no Atlas-backed end-to-end journey yet |
| FR-13 | Text chat across student, team and client contexts with timestamp and read status; real time optional | `/student/messages`, `/client/messages`, `/workspace/:projectId` | `/api/v1/messages` | Direct-message controllers/models/routes implemented; message read and access behavior still needs database integration verification |
| FR-14 | Post-completion reviews with overall, communication, technical and professionalism ratings | `/workspace/:projectId`, profile reviews | `/api/v1/reviews`, `/api/v1/users/:id/reviews` | `communityController.test.js`; rating validation and participant eligibility covered |
| FR-15 | Verify student and business accounts using their required evidence, with admin review and badge | `/student/verification`, `/client/verification`, admin verification panel | `/api/v1/verification-documents`, `/api/v1/admin/verification-documents` | `cloudinary.test.js`; signed access implementation covered; live upload/review requires Cloudinary configuration and database |
| FR-16 | Notifications for invitation, skill request, application received/accepted/rejected, new project/message, deadline, completion and review | `/notifications` | `/api/v1/notifications` | `deadlineNotifications.test.js`; event creation is implemented; not every event has an isolated notification assertion |
| FR-17 | Admin user management | `/admin/dashboard` | `/api/v1/admin/users` and user action routes | Admin controller/routes implemented; no dedicated admin-controller tests; live journey remains unverified |
| FR-18 | Admin project management and moderation | `/admin/dashboard` | `/api/v1/admin/projects` and project action routes | Admin controller/routes implemented; no dedicated admin-controller tests; live journey remains unverified |
| FR-19 | Report users, projects, messages and reviews; investigate, act and close reports | Report controls, `/admin/dashboard` | `POST /api/v1/reports`, `/api/v1/admin/reports` | `communityController.test.js` covers review/report controller paths; direct-message report authorization implemented; admin workflow integration needs live verification |
| FR-20 | Admin analytics for the eight PRD metrics | `/admin/dashboard` | `GET /api/v1/admin/metrics` | Eight metrics are returned by the endpoint; no dedicated metrics test; results need database-backed verification |

## Non-functional requirements

| PRD | Requirement | Evidence and remaining limit |
| --- | --- | --- |
| NFR-01 | Performance | Paginated endpoints and indexes are present; no load/performance benchmark has been run. |
| NFR-02 | Security | Authentication, password hashing, role checks, Joi validation and injection checks are implemented. `nfrCoverage.test.js` rejects Mongo operator objects for covered query schemas; a full security audit is not claimed. |
| NFR-03 | Usability / mobile support | Responsive React/Tailwind layouts and viewport metadata are present; `nfrCoverage.test.js` checks responsive markers. Device/browser visual testing remains. |
| NFR-04 | Scalability | Modular services and pagination support growth; no production-scale test has been run. |
| NFR-05 | Error handling | Central error middleware and validation/database error mappings exist; `nfrCoverage.test.js` covers representative responses. |
| NFR-06 | Maintainability | Frontend/backend are separated into modules, route/controller/model layers and reusable components; lint/build checks are run separately. |

## Remaining verification

- **MongoDB Atlas:** student, client and admin journeys were not completed because the configured cluster refused the connection. The applicant-selection path uses a transaction; verify it against a reachable replica-set Atlas database.
- **External providers:** email verification/reset, Google sign-in and Cloudinary upload require valid provider settings and credentials in local ignored `.env` files. Never commit or send those secrets in chat.
- **Security credential rotation:** the local JWT secret was rotated earlier. The MongoDB database password cannot be changed from the application workspace; rotate it in Atlas and update `MONGODB_URI`.
- **Test scope:** the backend automated suite is not an FR-by-FR browser acceptance suite. The matrix maps each requirement to implementation and the closest automated evidence without claiming that file-existence checks prove the full requirement.
