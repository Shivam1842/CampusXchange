
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

    applicationDeadline: {
      type: Date,
      default: null,
    },

    status: {
      type: String,
      enum: ["open", "in_progress", "completed", "cancelled"],
      default: "open",
      index: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    maxTeamSize: {
      type: Number,
      min: 1,
      max: 100,
      default: 5,
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

projectSchema.index({ title: "text", description: "text", category: "text" });
projectSchema.index({ status: 1, createdAt: -1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
