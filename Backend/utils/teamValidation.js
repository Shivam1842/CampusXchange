
import Joi from "joi";

const skillsSchema = Joi.array()
  .items(Joi.string().trim().min(1).max(50))
  .max(20)
  .unique()
  .default([]);

export const createTeamSchema = Joi.object({
  name: Joi.string().trim().min(3).max(80).required(),

  description: Joi.string().trim().max(1000).allow("").default(""),

  skills: skillsSchema,
}).unknown(false);

export const updateTeamSchema = Joi.object({
  name: Joi.string().trim().min(3).max(80),

  description: Joi.string().trim().max(1000).allow(""),

  skills: skillsSchema,
  status: Joi.string().valid("forming", "active", "completed", "disbanded"),
})
  .min(1)
  .unknown(false);

export const listTeamsQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),

  limit: Joi.number().integer().min(1).max(50).default(10),

  status: Joi.string().valid(
    "forming",
    "active",
    "completed",
    "disbanded"
  ),

  search: Joi.string().trim().max(100).allow(""),
}).unknown(false);
