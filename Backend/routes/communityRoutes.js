import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createReview, getUserReviews, createReport } from "../controllers/communityController.js";
const router = express.Router();
router.post("/reviews", protect, createReview);
router.post("/reports", protect, createReport);
router.get("/users/:id/reviews", getUserReviews);
export default router;
