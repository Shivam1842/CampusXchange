
import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 3,
      maxlength: 80,
    },

    description: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          enum: ["owner", "member"],
          default: "member",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    skills: {
      type: [String],
      default: [],
    },

    status: {
      type: String,
      enum: ["forming", "active", "completed", "disbanded"],
      default: "forming",
      index: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Helps find teams by owner and newest first.
teamSchema.index({ owner: 1, createdAt: -1 });

// Prevents duplicate users from being added to the same team.
teamSchema.index({ _id: 1, "members.user": 1 });

const Team = mongoose.model("Team", teamSchema);

export default Team;
