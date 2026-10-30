
import Profile from "../models/Profile.js";
import User from "../models/User.js";

const studentFields = [
  "title",
  "headline",
  "university",
  "course",
  "year",
  "experience",
  "availability",
  "skills",
  "certifications",
  "portfolio",
  "bio",
  "location",
  "education",
  "skillsOffered",
  "skillsWanted",
  "wantedSkills",
  "interests",
  "portfolioLinks",
  "socialLinks",
];

const clientFields = [
  "businessName",
  "contactName",
  "contactEmail",
  "contactPhone",
  "industry",
  "companySize",
  "website",
  "description",
  "businessDescription",
];

const serializeProfile = (profile) => {
  const source = profile?.toObject ? profile.toObject() : profile;
  if (!source) return null;
  const user = source.user && typeof source.user === "object" ? source.user : null;
  const result = {
    ...source,
    id: String(source._id ?? source.id),
    user: source.user == null ? null : String(user?._id ?? source.user._id ?? source.user),
    title: source.title ?? source.headline ?? "",
    wantedSkills: source.wantedSkills ?? source.skillsWanted ?? [],
    description: source.description ?? source.businessDescription ?? "",
    name: source.name ?? user?.name,
    email: source.email ?? user?.email,
    avatar: source.avatar ?? user?.avatar ?? "",
    isVerified: source.isVerified ?? user?.isVerified ?? false,
  };
  delete result._id;
  delete result.__v;
  return result;
};

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
    const query = Profile.findOne({ user: req.user._id });
    const profile = await (query.populate ? query.populate("user", "name email avatar isVerified") : query);
    return res.status(200).json({
      success: true,
      data: {
        profile: serializeProfile(profile),
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
    if (req.user.role === "student") {
      if (Object.hasOwn(updates, "title")) { updates.headline = updates.title; delete updates.title; }
      if (Object.hasOwn(updates, "wantedSkills")) { updates.skillsWanted = updates.wantedSkills; delete updates.wantedSkills; }
      if (Object.hasOwn(updates, "skills")) {
        updates.skillsOffered = updates.skills.map((skill) => skill.name);
      }
    } else {
      if (Object.hasOwn(updates, "description")) {
        updates.businessDescription = updates.description;
        delete updates.description;
      }
    }

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
        returnDocument: "after",
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    const populated = profile?.populate ? await profile.populate("user", "name email avatar isVerified") : profile;
    return res.status(200).json({
      success: true,
      message: "Profile saved successfully.",
      data: { profile: serializeProfile(populated) },
    });
  } catch (error) {
    next(error);
  }
};

const normalized = (items = []) => items.map((item) => String(item).trim().toLowerCase()).filter(Boolean);

export const discoverPartners = async (req, res, next) => {
  try {
    if (req.user.role !== "student") return res.status(403).json({ success: false, message: "Only students can discover partners." });
    const { page = 1, limit = 12, search = "", skill, experience, interest, availability, requirements } = req.partnerQuery ?? {};
    const requiredItems = Array.isArray(requirements) ? requirements : typeof requirements === "string" ? requirements.split(",") : [];
    const current = await Profile.findOne({ user: req.user._id });
    const [users, profiles] = await Promise.all([
      User.find({ role: "student", _id: { $ne: req.user._id } }).select("name avatar role").lean(),
      Profile.find({ user: { $ne: req.user._id } }).lean(),
    ]);
    const usersById = new Map(users.map((user) => [String(user._id), user]));
    const offered = normalized(current?.skillsOffered);
    const wanted = normalized(current?.skillsWanted);
    const partners = profiles.flatMap((profile) => {
      const user = usersById.get(String(profile.user));
      if (!user) return [];
      const skillsOffered = profile.skillsOffered ?? [];
      const skillsWanted = profile.skillsWanted ?? [];
      const nestedSkillNames = (profile.skills ?? []).map((item) => item?.name ?? item);
      const allSkills = normalized([...skillsOffered, ...skillsWanted, ...nestedSkillNames]);
      const profileInterests = profile.interests ?? [];
      const text = [user.name, profile.headline, profile.location, profile.university, profile.course, profile.experience, profile.availability, ...profileInterests, ...allSkills].join(" ").toLowerCase();
      if (search && !text.includes(search.toLowerCase())) return [];
      if (skill && !allSkills.includes(skill.toLowerCase())) return [];
      if (experience && !String(profile.experience ?? "").toLowerCase().includes(experience.toLowerCase())) return [];
      if (interest && !normalized(profileInterests).includes(interest.toLowerCase())) return [];
      if (availability && !String(profile.availability ?? "").toLowerCase().includes(availability.toLowerCase())) return [];
      if (requiredItems.length && !requiredItems.map((item) => item.trim().toLowerCase()).filter(Boolean).every((requirement) => allSkills.includes(requirement) || profileInterests.some((item) => String(item).trim().toLowerCase() === requirement))) return [];
      const theirOffered = normalized(skillsOffered), theirWanted = normalized(skillsWanted);
      const score = offered.length + wanted.length ? Math.round(100 * ((offered.filter((s) => theirWanted.includes(s)).length + wanted.filter((s) => theirOffered.includes(s)).length) / Math.max(1, offered.length + wanted.length))) : null;
      return [{ id: String(user._id), name: user.name, avatar: user.avatar ?? "", headline: profile.headline ?? "", title: profile.headline ?? "", location: profile.location ?? "", university: profile.university ?? "", year: profile.year ?? "", experience: profile.experience ?? "", availability: profile.availability ?? "", skills: profile.skills ?? skillsOffered, skillsOffered, skillsWanted, wantedSkills: skillsWanted, interests: profileInterests, matchPercent: score }];
    });
    partners.sort((a, b) => (b.matchPercent ?? -1) - (a.matchPercent ?? -1));
    const start = (page - 1) * limit;
    const results = partners.slice(start, start + limit);
    return res.status(200).json({ success: true, data: { partners: results }, meta: { page, limit, total: partners.length, totalPages: Math.ceil(partners.length / limit) } });
  } catch (error) { return next(error); }
};

export const getStudentById = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid student identifier.", errors: [] });
    const student = await User.findOne({ _id: req.params.id, role: "student", status: "active" }).select("name avatar isVerified").lean();
    if (!student) return res.status(404).json({ success: false, message: "Student not found.", errors: [] });
    const profile = await Profile.findOne({ user: student._id }).lean();
    return res.json({ success: true, data: { student: { id: String(student._id), name: student.name, avatar: student.avatar, isVerified: student.isVerified, ...(profile || {}) } } });
  } catch (error) { return next(error); }
};
