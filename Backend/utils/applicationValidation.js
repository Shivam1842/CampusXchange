
import Joi from "joi";

export const createApplicationSchema = Joi.object({
  coverLetter: Joi.string()
    .trim()
    .min(20)
    .max(3000)
    .required(),

  proposedContribution: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .default(""),
}).unknown(false);

export const listApplicationsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),

  status: Joi.string().valid(
    "pending",
    "shortlisted",
    "accepted",
    "rejected",
    "withdrawn"
  ),
}).unknown(false);

export const updateApplicationStatusSchema = Joi.object({
  status: Joi.string()
    .valid("shortlisted", "accepted", "rejected")
    .required(),
}).unknown(false);
