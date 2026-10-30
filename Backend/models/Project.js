
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Project title is required."],
      trim: true,
      minlength: 5,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Project description is required."],
      trim: true,
      minlength: 20,
      maxlength: 5000,
    },

    requirements: { type: [String], default: [] },
    isDraft: { type: Boolean, default: false, index: true },
    moderationStatus: { type: String, enum: ["approved", "pending", "removed"], default: "approved", index: true },
    progress: { type: Number, min: 0, max: 100, default: 0 },
    milestones: { type: [mongoose.Schema.Types.Mixed], default: [] },
    tasks: { type: [new mongoose.Schema({ title: { type: String, required: true, trim: true, maxlength: 200 }, description: { type: String, trim: true, maxlength: 1000, default: "" }, assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, status: { type: String, enum: ["not_started", "in_progress", "completed"], default: "not_started" }, dueDate: { type: Date, default: null } }, { timestamps: true })], default: [] },
    messages: { type: [new mongoose.Schema({ sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, text: { type: String, required: true, trim: true, maxlength: 5000 }, readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }] }, { timestamps: true })], default: [] },
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    selectionVersion: { type: Number, default: 0, select: false },

    category: {
      type: String,
      required: [true, "Project category is required."],
      trim: true,
      maxlength: 80,
    },

    skillsRequired: {
      type: [
        {
          type: String,
          trim: true,
          maxlength: 60,
        },
      ],
      default: [],
    },

    projectType: {
      type: String,
      enum: ["individual", "team"],
      default: "team",
    },

    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced", "any"],
      default: "any",
    },

    duration: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    budget: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    applicationDeadline: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: [
        "open",
        "in_progress",
        "under_review",
        "completed",
        "cancelled",
      ],
      default: "open",
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // Retained for compatibility with existing project records.
    maxTeamSize: {
      type: Number,
      min: 1,
      max: 100,
      default: 5,
    },

    // New frontend field. Supports the legacy field's full range so
    // existing records remain valid when updated.
    studentsRequired: {
      type: Number,
      min: 1,
      max: 100,
      default: function () {
        return this.maxTeamSize ?? 5;
      },
    },

    isRemote: {
      type: Boolean,
      default: true,
    },

    location: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

projectSchema.index({
  title: "text",
  description: "text",
  category: "text",
});

projectSchema.index({ status: 1, createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
