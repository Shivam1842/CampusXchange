import express from "express";
import { studentDashboard, clientDashboard } from "../controllers/dashboardController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
const router = express.Router();
router.get("/student", protect, authorize("student"), studentDashboard);
router.get("/client", protect, authorize("client"), clientDashboard);
export default router;
