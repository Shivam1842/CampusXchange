
import Joi from "joi";

const objectIdPattern = /^[0-9a-fA-F]{24}$/;

const projectStatuses = [
  "open",
  "in_progress",
  "under_review",
  "completed",
  "cancelled",
];

const projectFields = {
  title: Joi.string().trim().min(5).max(150),

  description: Joi.string().trim().min(20).max(5000),

  category: Joi.string().trim().min(2).max(80),

  skills: Joi.array()
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

  budget: Joi.string().trim().max(100).allow(""),

  deadline: Joi.date().iso().greater("now").allow(null),

  maxTeamSize: Joi.number().integer().min(1).max(100),

  studentsRequired: Joi.number().integer().min(1).max(20),

  requirements: Joi.array().items(Joi.string().trim().max(500)).max(30),
  isDraft: Joi.boolean(),

  isRemote: Joi.boolean(),

  location: Joi.string().trim().max(150).allow(""),
};

// Create: clients cannot choose the initial project status.
// New projects are created with status "open" by the controller.
export const createProjectSchema = Joi.object({
  ...projectFields,
  title: projectFields.title.required(),
  description: projectFields.description.required(),
  category: projectFields.category.required(),
}).unknown(false);

// Update: status is allowed, but lifecycle transitions are enforced
// separately by projectController.js.
export const updateProjectSchema = Joi.object({
  ...projectFields,

  status: Joi.string().valid(...projectStatuses),
})
  .min(1)
  .unknown(false);

export const listProjectsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(10),

  status: Joi.string().valid(...projectStatuses),

  category: Joi.string().trim().max(80),

  skill: Joi.string().trim().max(60),

  q: Joi.string().trim().max(100),
  search: Joi.string().trim().max(100),

  deadlineBefore: Joi.date().iso(),

  sort: Joi.string().valid("newest", "deadline", "budget").default("newest"),

  owner: Joi.string().pattern(objectIdPattern),
}).unknown(false);
