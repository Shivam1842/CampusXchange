
import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },

    applicant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    coverLetter: {
      type: String,
      required: true,
      trim: true,
      minlength: 20,
      maxlength: 3000,
    },

    portfolioLink: { type: String, trim: true, maxlength: 500, default: "" },
    type: { type: String, enum: ["individual", "team"], default: "individual" },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    skills: { type: [{ type: String, trim: true, maxlength: 60 }], default: [] },
    previousProjects: { type: [{ type: String, trim: true, maxlength: 200 }], default: [] },
    availability: { type: String, trim: true, maxlength: 80, default: "" },
    selectedAt: { type: Date, default: null },

    proposedContribution: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "applied",
        "under_review",
        "shortlisted",
        "selected",
        "rejected",
        "withdrawn",
      ],
      default: "applied",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// A student can apply to a project only once.
applicationSchema.index(
  { project: 1, applicant: 1 },
  { unique: true }
);

const Application = mongoose.model("Application", applicationSchema);

export default Application;
