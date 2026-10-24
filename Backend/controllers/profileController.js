
import Profile from "../models/Profile.js";

const profileFields = [
  "headline",
  "bio",
  "location",
  "education",
  "skillsOffered",
  "skillsWanted",
  "interests",
  "portfolioLinks",
  "socialLinks",
  "businessName",
  "industry",
  "companySize",
  "website",
  "businessDescription",
];

const studentFields = [
  "headline",
  "bio",
  "location",
  "education",
  "skillsOffered",
  "skillsWanted",
  "interests",
  "portfolioLinks",
  "socialLinks",
];

const clientFields = [
  "headline",
  "bio",
  "location",
  "socialLinks",
  "businessName",
  "industry",
  "companySize",
  "website",
  "businessDescription",
];

const pickAllowedFields = (body, allowedFields) => {
  const result = {};

  for (const field of allowedFields) {
    if (Object.hasOwn(body, field)) {
      result[field] = body[field];
    }
  }

  return result;
};

export const getMyProfile = async (req, res, next) => {
  try {
    const profile = await Profile.findOne({ user: req.user._id });

    return res.status(200).json({
      success: true,
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createOrUpdateMyProfile = async (req, res, next) => {
  try {
    const allowedFields =
      req.user.role === "student"
        ? studentFields
        : req.user.role === "client"
          ? clientFields
          : [];

    if (allowedFields.length === 0) {
      return res.status(403).json({
        success: false,
        message: "Your role cannot create or update a profile here.",
      });
    }

    const updates = pickAllowedFields(req.body, allowedFields);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Provide at least one valid profile field to update.",
      });
    }

    const profile = await Profile.findOneAndUpdate(
      { user: req.user._id },
      {
        $set: updates,
        $setOnInsert: { user: req.user._id },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return res.status(200).json({
      success: true,
      message: "Profile saved successfully.",
      data: {
        profile,
      },
    });
  } catch (error) {
    next(error);
  }
};
