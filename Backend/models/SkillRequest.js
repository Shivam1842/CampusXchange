import mongoose from "mongoose";

const skillRequestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

skillRequestSchema.pre("validate", function () {
  if (
    this.sender &&
    this.recipient &&
    this.sender.equals(this.recipient)
  ) {
    this.invalidate("recipient", "You cannot send a skill request to yourself.");
  }
});

skillRequestSchema.index(
  { sender: 1, recipient: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "pending" },
    name: "unique_pending_skill_request",
  }
);

const SkillRequest = mongoose.model("SkillRequest", skillRequestSchema);

export default SkillRequest;
