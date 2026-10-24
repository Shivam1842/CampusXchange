# CampusXchange

## Backend logs

The backend writes timestamped application and error logs to
`Backend/logs/backend.log`. This file is generated when the backend starts and
is ignored by Git. Startup errors include diagnostic details while redacting
MongoDB connection credentials.