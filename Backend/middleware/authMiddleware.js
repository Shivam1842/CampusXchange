
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing.",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub).select(
      "_id name email role status isVerified isEmailVerified avatar"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account not found. Please log in again.",
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. Please contact support.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token. Please log in again.",
      });
    }

    next(error);
  }
};
