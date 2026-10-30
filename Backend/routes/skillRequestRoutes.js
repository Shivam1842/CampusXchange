import express from "express";
import {
  sendSkillRequest,
  listSkillRequests,
  acceptSkillRequest,
  rejectSkillRequest,
} from "../controllers/skillRequestController.js";
import { protect } from "../middleware/authMiddleware.js";
import {
  skillRequestListQuerySchema,
} from "../utils/profileValidation.js";

const router = express.Router();

const validateSkillRequestQuery = (req, res, next) => {
  const { error, value } = skillRequestListQuerySchema.validate(req.query, {
    abortEarly: false,
    convert: true,
  });

  if (error) {
    return res.status(400).json({
      success: false,
      message: "Invalid skill-request query parameters.",
      errors: error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      })),
    });
  }

  req.skillRequestQuery = value;
  next();
};

router.use(protect);

router.get("/", validateSkillRequestQuery, listSkillRequests);
router.post("/", sendSkillRequest);
router.post("/:userId", sendSkillRequest);
router.patch("/:requestId/accept", acceptSkillRequest);
router.patch("/:requestId/reject", rejectSkillRequest);

export default router;
