import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import Application from "../models/Application.js";

export async function notifyUpcomingDeadlines(now = new Date()) {
  const deadlineWindow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const projects = await Project.find({
    applicationDeadline: { $gt: now, $lte: deadlineWindow },
    status: { $in: ["open", "in_progress", "under_review"] },
  }).select("_id title owner participants applicationDeadline").lean();
  const projectIds = projects.map((project) => project._id);
  const applications = projectIds.length
    ? await Application.find({ project: { $in: projectIds } }).select("project applicant").lean()
    : [];
  const applicantsByProject = new Map();
  for (const application of applications) {
    const key = String(application.project);
    const applicants = applicantsByProject.get(key) || [];
    applicants.push(application.applicant);
    applicantsByProject.set(key, applicants);
  }

  const operations = projects.flatMap((project) => {
    const recipients = new Set([
      String(project.owner),
      ...(project.participants || []).map(String),
      ...(applicantsByProject.get(String(project._id)) || []).map(String),
    ]);
    const deadline = new Date(project.applicationDeadline).toISOString();
    return [...recipients].map((recipient) => {
      const dedupeKey = `deadline:${project._id}:${deadline}:${recipient}`;
      return {
        updateOne: {
          filter: { dedupeKey },
          update: {
            $setOnInsert: {
              recipient,
              type: "project_deadline",
              message: `The deadline for "${project.title}" is within 24 hours.`,
              resourceId: project._id,
              dedupeKey,
            },
          },
          upsert: true,
        },
      };
    });
  });

  if (operations.length) await Notification.bulkWrite(operations, { ordered: false });
  return operations.length;
}
