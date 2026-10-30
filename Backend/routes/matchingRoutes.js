import express from "express";
import { discoverPartners } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
import { partnerQuerySchema } from "../utils/profileValidation.js";

const router = express.Router();
router.get("/partners", protect, (req, res, next) => {
  const { error, value } = partnerQuerySchema.validate(req.query, { abortEarly: false, convert: true });
  if (error) return res.status(400).json({ success: false, message: "Invalid partner filters.", errors: error.details.map((item) => ({ field: item.path.join("."), message: item.message })) });
  req.partnerQuery = value;
  next();
}, discoverPartners);
export default router;
