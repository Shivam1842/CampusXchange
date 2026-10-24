
import mongoose from "mongoose";

const linkSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 50,
    },
    url: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const educationSchema = new mongoose.Schema(
  {
    institution: {
      type: String,
      trim: true,
      maxlength: 150,
    },
    qualification: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    fieldOfStudy: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    startYear: {
      type: Number,
      min: 1950,
      max: 2100,
    },
    endYear: {
      type: Number,
      min: 1950,
      max: 2100,
    },
  },
  { _id: false }
);

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },

    headline: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    bio: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },

    location: {
      type: String,
      trim: true,
      maxlength: 120,
      default: "",
    },

    education: {
      type: [educationSchema],
      default: [],
    },

    skillsOffered: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: [],
    },

    skillsWanted: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: [],
    },

    interests: {
      type: [{ type: String, trim: true, maxlength: 60 }],
      default: [],
    },

    portfolioLinks: {
      type: [linkSchema],
      default: [],
    },

    socialLinks: {
      type: [linkSchema],
      default: [],
    },

    businessName: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    industry: {
      type: String,
      trim: true,
      maxlength: 100,
      default: "",
    },

    companySize: {
      type: String,
      enum: ["", "1-10", "11-50", "51-200", "201-500", "500+"],
      default: "",
    },

    website: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    businessDescription: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const Profile = mongoose.model("Profile", profileSchema);

export default Profile;
