
import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const projectFields = {
  title: Joi.string().trim().min(5).max(150),
  description: Joi.string().trim().min(20).max(5000),
  category: Joi.string().trim().min(2).max(80),

  skillsRequired: Joi.array()
    .items(Joi.string().trim().min(1).max(60))
    .max(30),

  projectType: Joi.string().valid("individual", "team"),

  experienceLevel: Joi.string().valid(
    "beginner",
    "intermediate",
    "advanced",
    "any"
  ),

  duration: Joi.string().trim().max(100).allow(""),

  applicationDeadline: Joi.date().iso().greater("now").allow(null),

  maxTeamSize: Joi.number().integer().min(1).max(100),

  isRemote: Joi.boolean(),

  location: Joi.string().trim().max(150).allow(""),
};

export const createProjectSchema = Joi.object({
  ...projectFields,
  title: projectFields.title.required(),
  description: projectFields.description.required(),
  category: projectFields.category.required(),
}).unknown(false);

export const updateProjectSchema = Joi.object(projectFields)
  .min(1)
  .unknown(false);

export const listProjectsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  status: Joi.string().valid(
    "open",
    "in_progress",
    "completed",
    "cancelled"
  ),
  category: Joi.string().trim().max(80),
  search: Joi.string().trim().max(100),
  owner: Joi.string().pattern(objectIdPattern),
}).unknown(false);
