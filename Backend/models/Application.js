
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
    proposedContribution: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "accepted", "rejected", "withdrawn"],
      default: "pending",
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
