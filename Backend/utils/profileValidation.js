import Joi from "joi";

const skillList = Joi.array()
  .items(Joi.string().trim().min(1).max(60))
  .max(30)
  .unique((a, b) => a.toLowerCase() === b.toLowerCase());

const educationItem = Joi.object({
  institution: Joi.string().trim().max(150).allow(""),
  qualification: Joi.string().trim().max(120).allow(""),
  fieldOfStudy: Joi.string().trim().max(120).allow(""),
  startYear: Joi.number().integer().min(1950).max(2100),
  endYear: Joi.number().integer().min(1950).max(2100),
})
  .custom((value, helpers) => {
    if (
      value.startYear !== undefined &&
      value.endYear !== undefined &&
      value.endYear < value.startYear
    ) {
      return helpers.error("any.invalid");
    }

    return value;
  }, "education year order validation")
  .unknown(false);

const linkItem = Joi.object({
  label: Joi.string().trim().max(50).allow(""),
  url: Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .max(500)
    .required(),
}).unknown(false);

const commonFields = {
  title: Joi.string().trim().max(120).allow(""),
  bio: Joi.string().trim().max(1000).allow(""),
  location: Joi.string().trim().max(120).allow(""),
  socialLinks: Joi.array().items(linkItem).max(20),
};

const studentFields = {
  ...commonFields,
  university: Joi.string().trim().max(150).allow(""),
  course: Joi.string().trim().max(150).allow(""),
  year: Joi.string().trim().max(40).allow(""),
  experience: Joi.string().trim().max(2000).allow(""),
  availability: Joi.string().trim().max(80).allow(""),
  education: Joi.array().items(educationItem).max(20),
  skills: Joi.array().items(Joi.object({ name: Joi.string().trim().min(1).max(60).required(), level: Joi.string().valid("beginner", "intermediate", "advanced", "expert").default("beginner"), proficiency: Joi.number().integer().min(0).max(100).default(0) }).unknown(false)).max(30),
  wantedSkills: skillList,
  skillsOffered: skillList,
  skillsWanted: skillList,
  interests: skillList,
  portfolioLinks: Joi.array().items(linkItem).max(20),
  portfolio: Joi.array().items(Joi.object({ title: Joi.string().trim().required(), category: Joi.string().allow(""), description: Joi.string().allow(""), skills: skillList, url: Joi.string().uri({ scheme: ["http", "https"] }).allow("") }).unknown(false)).max(30),
  certifications: Joi.array().items(Joi.object({ name: Joi.string().trim().required(), issuer: Joi.string().allow(""), year: Joi.number().integer().min(1950).max(2100) }).unknown(false)).max(30),
};

const clientFields = {
  ...commonFields,
  businessName: Joi.string().trim().max(150).allow(""),
  contactName: Joi.string().trim().max(80).allow(""),
  contactEmail: Joi.string().email().max(254).allow(""),
  contactPhone: Joi.string().trim().max(40).allow(""),
  description: Joi.string().trim().max(1000).allow(""),
  industry: Joi.string().trim().max(100).allow(""),
  companySize: Joi.string().valid("", "1-10", "11-50", "51-200", "201-500", "500+"),
  website: Joi.string()
    .trim()
    .uri({ scheme: ["http", "https"] })
    .max(500)
    .allow(""),
  businessDescription: Joi.string().trim().max(1000).allow(""),
};

export const updateStudentProfileSchema = Joi.object(studentFields)
  .min(1)
  .unknown(false);

export const updateClientProfileSchema = Joi.object(clientFields)
  .min(1)
  .unknown(false);

export const partnerQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
  search: Joi.string().trim().max(100).allow(""),
  skill: Joi.string().trim().min(1).max(60),
  experience: Joi.string().trim().max(100).allow(""),
  interest: Joi.string().trim().max(60),
  availability: Joi.string().trim().max(80),
  requirements: Joi.alternatives().try(
    Joi.string().trim().max(500).allow(""),
    Joi.array().items(Joi.string().trim().min(1).max(60)).max(20)
  ),
}).unknown(false);


export const skillRequestListQuerySchema = Joi.object({
  status: Joi.string().valid("pending", "accepted", "rejected"),
  box: Joi.string().valid("sent", "received"),
  direction: Joi.string().valid("incoming", "outgoing"),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
}).unknown(false);
