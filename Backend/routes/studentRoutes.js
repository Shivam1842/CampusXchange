import express from "express";
import { getStudentById } from "../controllers/profileController.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();
router.get("/:id", protect, getStudentById);
export default router;
