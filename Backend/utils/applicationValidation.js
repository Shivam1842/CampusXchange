
import Joi from "joi";

const applicationStatuses = [
  "applied",
  "under_review",
  "shortlisted",
  "selected",
  "rejected",
  "withdrawn",
];

export const createApplicationSchema = Joi.object({
  coverMessage: Joi.string().trim().min(20).max(3000),
  portfolioLink: Joi.string().uri().max(500).allow(""),
  type: Joi.string().valid("individual", "team").default("individual"),
  team: Joi.string().pattern(/^[0-9a-fA-F]{24}$/).when("type", { is: "team", then: Joi.required(), otherwise: Joi.forbidden() }),
  skills: Joi.array().items(Joi.string().trim().max(60)).max(30).default([]),
  previousProjects: Joi.array().items(Joi.string().trim().max(200)).max(20).default([]),
  availability: Joi.string().trim().max(80).allow("").default(""),
  // Legacy request keys accepted during migration.
  coverLetter: Joi.string()
    .trim()
    .min(20)
    .max(3000),

  proposedContribution: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .default(""),
}).xor("coverMessage", "coverLetter").unknown(false);

export const listApplicationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(10),

  status: Joi.string().valid(...applicationStatuses),
}).unknown(false);

export const updateApplicationStatusSchema = Joi.object({
  status: Joi.string()
    .valid("under_review", "shortlisted", "selected", "rejected")
    .required(),
}).unknown(false);
