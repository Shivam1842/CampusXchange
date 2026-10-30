
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import dns from "node:dns";

import logger from "./utils/logger.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import skillRequestRoutes from "./routes/skillRequestRoutes.js";
import matchingRoutes from "./routes/matchingRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import communityRoutes from "./routes/communityRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import { notifyUpcomingDeadlines } from "./utils/deadlineNotifications.js";
import { apiErrorHandler } from "./middleware/errorHandler.js";
import directMessageRoutes from "./routes/directMessageRoutes.js";
import verificationRoutes from "./routes/verificationRoutes.js";

// DNS workaround for MongoDB Atlas SRV resolution
dns.setServers(["1.1.1.1", "8.8.8.8"]);

// Load environment variables
dotenv.config();

const mongoUri = process.env.MONGODB_URI?.trim();
const mongoUriIsSrv = mongoUri?.startsWith("mongodb+srv://");
let mongoHost;

if (!mongoUri) {
  logger.error(
    "Server startup failed: MONGODB_URI is missing from backend/.env."
  );
  process.exit(1);
}

if (!mongoUriIsSrv) {
  logger.error(
    "Server startup failed: MONGODB_URI must use the mongodb+srv:// format."
  );
  process.exit(1);
}

try {
  mongoHost = new URL(mongoUri).hostname;
} catch {
  logger.error(
    "Server startup failed: MONGODB_URI is not a valid MongoDB connection URI."
  );
  process.exit(1);
}

if (!mongoHost) {
  logger.error(
    "Server startup failed: MONGODB_URI does not contain a cluster hostname."
  );
  process.exit(1);
}

// Initialize Express
const app = express();

// Security and request middleware
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "1mb" }));

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "CampusXchange API is running!",
  });
});

// API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/profiles", profileRoutes);
app.use("/api/v1/projects", projectRoutes);
app.use("/api/v1/applications", applicationRoutes);
app.use("/api/v1/teams", teamRoutes);
app.use("/api/v1/skill-requests", skillRequestRoutes);
app.use("/api/v1/matching", matchingRoutes);
app.use("/api/v1/students", studentRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/messages", directMessageRoutes);
app.use("/api/v1/verification-documents", verificationRoutes);
app.use("/api/v1", communityRoutes);

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
    errors: [],
  });
});

app.use(apiErrorHandler);

// Connect to MongoDB before starting the server
const startServer = async () => {
  try {
    await mongoose.connect(mongoUri);

    logger.info("MongoDB Atlas connected successfully.");

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      logger.info(`CampusXchange server running on port ${PORT}`);
      const checkDeadlines = () => notifyUpcomingDeadlines().catch((error) => {
        logger.error("Upcoming project deadline notifications could not be created.", error);
      });
      void checkDeadlines();
      setInterval(checkDeadlines, 60 * 60 * 1000);
    });
  } catch (error) {
    const errorCode = error?.code;

    const isSrvDnsError =
      error?.syscall === "querySrv" ||
      (errorCode === "ECONNREFUSED" &&
        String(error?.message).includes("querySrv"));

    if (isSrvDnsError) {
      logger.error(
        `Server startup failed: Node.js could not resolve the Atlas SRV DNS record for ${mongoHost}. Check the Atlas hostname and DNS/network settings.`,
        error
      );

      logger.info(
        `Test with: nslookup -type=SRV _mongodb._tcp.${mongoHost}`
      );
    } else {
      const safeCode =
        typeof errorCode === "string" && /^[A-Z0-9_]+$/i.test(errorCode)
          ? ` (error code: ${errorCode})`
          : "";

      logger.error(
        `Server startup failed: MongoDB connection could not be established${safeCode}. Check Atlas cluster status, database credentials, and Network Access settings.`,
        error
      );
    }

    process.exit(1);
  }
};

mongoose.connection.on("error", (error) => {
  logger.error("MongoDB connection error", error);
});

mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB connection was disconnected.");
});

mongoose.connection.on("reconnected", () => {
  logger.info("MongoDB connection was restored.");
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception; shutting down.", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection; shutting down.", reason);
  process.exit(1);
});

startServer();
