import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const evidence = [
  ["FR-01", "Frontend/src/pages/AuthPage.jsx", "Backend/routes/authRoutes.js", "Backend/tests/authController.test.js"],
  ["FR-02", "Frontend/src/pages/AuthAction.jsx", "Backend/routes/authRoutes.js", "Backend/tests/nfrCoverage.test.js"],
  ["FR-03", "Frontend/src/pages/student/Profile.jsx", "Backend/routes/profileRoutes.js", "Backend/tests/cloudinary.test.js"],
  ["FR-04", "Frontend/src/pages/client/Profile.jsx", "Backend/routes/profileRoutes.js", "Backend/tests/profileController.test.js"],
  ["FR-05", "Frontend/src/pages/student/Projects.jsx", "Backend/routes/projectRoutes.js", "Backend/tests/projectController.test.js"],
  ["FR-06", "Frontend/src/pages/student/Partners.jsx", "Backend/routes/profileRoutes.js", "Backend/tests/profileController.test.js"],
  ["FR-07", "Frontend/src/pages/student/Teams.jsx", "Backend/routes/teamRoutes.js", "Backend/tests/teamController.test.js"],
  ["FR-08", "Frontend/src/pages/student/SkillRequests.jsx", "Backend/routes/skillRequestRoutes.js", "Backend/tests/skillRequestController.test.js"],
  ["FR-09", "Frontend/src/pages/student/Teams.jsx", "Backend/routes/teamRoutes.js", "Backend/tests/teamController.test.js"],
  ["FR-10", "Frontend/src/pages/client/PostProject.jsx", "Backend/routes/projectRoutes.js", "Backend/tests/projectController.test.js"],
  ["FR-11", "Frontend/src/pages/client/Applications.jsx", "Backend/routes/applicationRoutes.js", "Backend/tests/applicationController.test.js"],
  ["FR-12", "Frontend/src/pages/client/Applications.jsx", "Backend/routes/applicationRoutes.js", "Backend/tests/applicationController.test.js"],
  ["FR-13", "Frontend/src/pages/Messages.jsx", "Backend/routes/directMessageRoutes.js", "Backend/tests/nfrCoverage.test.js"],
  ["FR-14", "Frontend/src/pages/Workspace.jsx", "Backend/routes/projectRoutes.js", "Backend/tests/nfrCoverage.test.js"],
  ["FR-15", "Frontend/src/pages/Verification.jsx", "Backend/routes/verificationRoutes.js", "Backend/tests/cloudinary.test.js"],
  ["FR-16", "Frontend/src/pages/Notifications.jsx", "Backend/routes/notificationRoutes.js", "Backend/tests/deadlineNotifications.test.js"],
  ["FR-17", "Frontend/src/components/ReviewForm.jsx", "Backend/routes/communityRoutes.js", "Backend/tests/communityController.test.js"],
  ["FR-18", "Frontend/src/pages/admin/Dashboard.jsx", "Backend/routes/adminRoutes.js", "Backend/tests/communityController.test.js"],
  ["FR-19", "Frontend/src/pages/admin/Dashboard.jsx", "Backend/routes/adminRoutes.js", "Backend/tests/nfrCoverage.test.js"],
  ["FR-20", "Frontend/src/pages/admin/Dashboard.jsx", "Backend/routes/adminRoutes.js", "Backend/tests/nfrCoverage.test.js"],
];

for (const [requirement, screen, route, coverageTest] of evidence) {
  test(`${requirement} has a screen, API route group, and automated coverage reference`, () => {
    for (const file of [screen, route, coverageTest]) assert.ok(fs.existsSync(path.join(root, file)), `${requirement}: missing ${file}`);
  });
}
