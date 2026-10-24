
import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(80).required(),

  email: Joi.string().trim().email().max(254).lowercase().required(),

  password: Joi.string().min(8).max(128).required(),

  // Public registration permits only student or client accounts.
  // Admin accounts must be created through a trusted administrative process.
  role: Joi.string().valid("student", "client").default("student"),
}).unknown(false);

export const loginSchema = Joi.object({
  email: Joi.string().trim().email().max(254).lowercase().required(),

  password: Joi.string().min(1).max(128).required(),
}).unknown(false);
