import mongoose from "mongoose";
import dotenv from "dotenv";
import Application from "../models/Application.js";
import Project from "../models/Project.js";
import Profile from "../models/Profile.js";

dotenv.config();
const uri = process.env.MONGODB_URI?.trim();
if (!uri) throw new Error("MONGODB_URI is required to run the contract migration.");

await mongoose.connect(uri);
try {
  const pending = await Application.updateMany({ status: "pending" }, { $set: { status: "applied" } });
  const accepted = await Application.updateMany({ status: "accepted" }, [{ $set: { status: "selected", selectedAt: { $ifNull: ["$selectedAt", "$updatedAt"] } } }]);
  const projects = await Project.updateMany({}, [{ $set: {
    isDraft: { $ifNull: ["$isDraft", false] },
    moderationStatus: { $ifNull: ["$moderationStatus", "approved"] },
    studentsRequired: { $ifNull: ["$studentsRequired", { $ifNull: ["$maxTeamSize", 5] }] },
    requirements: { $ifNull: ["$requirements", []] },
    participants: { $ifNull: ["$participants", []] },
    progress: { $ifNull: ["$progress", 0] },
    tasks: { $ifNull: ["$tasks", []] },
    milestones: { $ifNull: ["$milestones", []] },
    messages: { $ifNull: ["$messages", []] },
  } }]);

  let migratedProfiles = 0;
  const profiles = await Profile.find({}).lean();
  for (const profile of profiles) {
    const education = profile.education?.[0] || {};
    const skills = profile.skills?.length ? profile.skills : (profile.skillsOffered || []).map((skill) => typeof skill === "string" ? { name: skill, level: "beginner", proficiency: 0 } : skill);
    const wantedSkills = profile.wantedSkills?.length ? profile.wantedSkills : profile.skillsWanted || [];
    const portfolio = profile.portfolio?.length ? profile.portfolio : (profile.portfolioLinks || []).map((item) => ({ title: item.label || "Portfolio", category: "", description: "", skills: [], url: item.url || "" }));
    await Profile.updateOne({ _id: profile._id }, { $set: {
      university: profile.university || education.institution || "",
      course: profile.course || education.fieldOfStudy || education.qualification || "",
      year: profile.year || (education.endYear ? String(education.endYear) : ""),
      skills, wantedSkills, portfolio,
      availability: profile.availability || "",
      certifications: profile.certifications || [],
      contactName: profile.contactName || "",
      contactEmail: profile.contactEmail || "",
      contactPhone: profile.contactPhone || "",
    } });
    migratedProfiles += 1;
  }
  let migratedApplicationSkills = 0;
  const applications = await Application.find({ skills: { $size: 0 } }).select("_id applicant").lean();
  for (const application of applications) {
    const profile = await Profile.findOne({ user: application.applicant }).select("skills skillsOffered").lean();
    const skills = profile?.skills?.length ? profile.skills.map((skill) => skill.name) : profile?.skillsOffered || [];
    if (skills.length) { await Application.updateOne({ _id: application._id }, { $set: { skills } }); migratedApplicationSkills += 1; }
  }
  console.log(JSON.stringify({ pendingApplications: pending.modifiedCount, acceptedApplications: accepted.modifiedCount, projects: projects.modifiedCount, profiles: migratedProfiles, applicationSkills: migratedApplicationSkills }));
} finally {
  await mongoose.disconnect();
}
