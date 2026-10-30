import Joi from "joi";

// Validate individual skills.
const skillSchema = Joi.string()
  .trim()
  .min(1)
  .max(50)
  .custom((value, helpers) => {
    if (value.length === 0) {
      return helpers.error("string.empty");
    }

    return value;
  });

// Validate the skills array.
// Duplicate skills are rejected without considering letter case.
const skillsSchema = Joi.array()
  .items(skillSchema)
  .max(20)
  .unique((a, b) => a.toLowerCase() === b.toLowerCase())
  .default([]);

// Create a new team.
export const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(3).max(80).required(),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow("")
    .default(""),

  skills: skillsSchema,
}).unknown(false);

// Update team details.
// Team status must be changed through the dedicated status endpoint.
export const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(3).max(80),

  description: Joi.string()
    .trim()
    .max(1000)
    .allow(""),

  skills: skillsSchema,
})
  .min(1)
  .unknown(false);

// Update team lifecycle status through the dedicated endpoint.
// "forming" is the initial state; disbanding uses its dedicated endpoint.
export const updateTeamStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "completed")
    .required(),
}).unknown(false);

// Validate team-list query parameters.
export const listTeamsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(10),

  status: Joi.string().valid(
    "forming",
    "active",
    "completed",
    "disbanded"
  ),

  search: Joi.string()
    .trim()
    .max(100)
    .allow(""),
}).unknown(false);
