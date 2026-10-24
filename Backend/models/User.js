
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must contain at least 2 characters"],
      maxlength: [80, "Name cannot exceed 80 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please enter a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [8, "Password must contain at least 8 characters"],
    },

    role: {
      type: String,
      enum: ["student", "client", "admin"],
      default: "student",
      required: true,
    },

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
      required: true,
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    avatar: {
      type: String,
      default: "",
      trim: true,
    },

    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const User = mongoose.model("User", userSchema);

export default User;
