
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";
import crypto from "node:crypto";
import { sendEmail } from "../utils/email.js";

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");
const frontendUrl = () => (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
const issueEmailVerification = async (user) => {
  const token = crypto.randomBytes(32).toString("hex");
  user.emailVerificationTokenHash = hashToken(token);
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save();
  await sendEmail({ to: user.email, subject: "Verify your CampusXchange email", html: `<p>Verify your email by <a href="${frontendUrl()}/verify-email?token=${token}">opening this link</a>. It expires in 24 hours.</p>` });
};

// Remove the password hash and other private fields from API responses.
const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  isVerified: user.isVerified,
  isEmailVerified: user.isEmailVerified,
  avatar: user.avatar,
  lastLogin: user.lastLogin,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

// Register a student or client.
export const register = async (req, res, next) => {
  try {
    const name = req.body.name.trim();
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;
    const role = req.body.role || "student";

    // Defence in depth: public registration must never create admins.
    if (!["student", "client"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration role.",
        errors: [{ field: "role", message: "Role must be student or client." }],
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
        errors: [{ field: "email", message: "Email is already registered." }],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    try { await issueEmailVerification(user); }
    catch (emailError) { req.log?.warn?.("Verification email could not be sent.", emailError); }

    const token = generateToken(user);

    return res.status(201).json({
      success: true,
      message: "Account registered successfully.",
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    // Handle duplicate emails even if two requests arrive together.
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
        errors: [{ field: "email", message: "Email is already registered." }],
      });
    }

    next(error);
  }
};

// Log in an existing user.
export const login = async (req, res, next) => {
  try {
    const email = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    // Password is excluded from normal queries, so request it explicitly.
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        errors: [],
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
        errors: [],
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. Please contact support.",
        errors: [],
      });
    }

    if (process.env.EMAIL_VERIFICATION_REQUIRED === "true" && !user.isEmailVerified) {
      return res.status(403).json({ success: false, message: "Verify your email address before signing in.", errors: [] });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      data: {
        user: formatUser(user),
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Return the currently authenticated user's information.
export const getMe = (req, res) => {
  return res.status(200).json({
    success: true,
    data: {
      user: formatUser(req.user),
    },
  });
};

// Change the authenticated user's password.
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (
      typeof currentPassword !== "string" ||
      typeof newPassword !== "string" ||
      newPassword.length < 8 ||
      newPassword.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Provide your current password and a new password between 8 and 128 characters.",
        errors: [{ field: "newPassword", message: "Provide current password and a new password between 8 and 128 characters." }],
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
        errors: [],
      });
    }

    const passwordMatches = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!passwordMatches) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
        errors: [{ field: "currentPassword", message: "Current password is incorrect." }],
      });
    }

    const samePassword = await bcrypt.compare(
      newPassword,
      user.password
    );

    if (samePassword) {
      return res.status(400).json({
        success: false,
        message: "Choose a password different from your current password.",
        errors: [{ field: "newPassword", message: "Choose a password different from your current password." }],
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully. Please log in again.",
    });
  } catch (error) {
    next(error);
  }
};

// JWT authentication is stateless; the client removes its stored token.
export const logout = (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Logout successful. Please remove your stored token.",
  });
};

export const requestPasswordReset = async (req, res, next) => {
  try {
    const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
    const user = email ? await User.findOne({ email, status: "active" }) : null;
    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      user.passwordResetTokenHash = hashToken(token);
      user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await user.save();
      await sendEmail({ to: user.email, subject: "Reset your CampusXchange password", html: `<p>Reset your password by <a href="${frontendUrl()}/reset-password?token=${token}">opening this link</a>. It expires in one hour.</p>` });
    }
    return res.json({ success: true, message: "If that account exists, a password reset email has been sent." });
  } catch (error) { return next(error); }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body || {};
    if (typeof token !== "string" || typeof password !== "string" || password.length < 8 || password.length > 128) return res.status(400).json({ success: false, message: "Provide a valid reset token and password of at least 8 characters.", errors: [] });
    const user = await User.findOne({ passwordResetTokenHash: hashToken(token), passwordResetExpiresAt: { $gt: new Date() } }).select("+password +passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return res.status(400).json({ success: false, message: "Password reset link is invalid or expired.", errors: [] });
    user.password = await bcrypt.hash(password, 12);
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
    return res.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch (error) { return next(error); }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const token = req.body?.token;
    const user = typeof token === "string" ? await User.findOne({ emailVerificationTokenHash: hashToken(token), emailVerificationExpiresAt: { $gt: new Date() } }).select("+emailVerificationTokenHash +emailVerificationExpiresAt") : null;
    if (!user) return res.status(400).json({ success: false, message: "Email verification link is invalid or expired.", errors: [] });
    user.isEmailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    return res.json({ success: true, message: "Email address verified." });
  } catch (error) { return next(error); }
};

export const googleSignIn = async (req, res, next) => {
  try {
    const credential = req.body?.credential;
    if (!process.env.GOOGLE_CLIENT_ID) return res.status(503).json({ success: false, message: "Google sign-in is not configured.", errors: [] });
    if (typeof credential !== "string" || credential.length > 10000) return res.status(400).json({ success: false, message: "Google credential is required.", errors: [] });
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) return res.status(401).json({ success: false, message: "Google credential is invalid.", errors: [] });
    const claims = await response.json();
    if (claims.aud !== process.env.GOOGLE_CLIENT_ID || claims.email_verified !== "true" || !claims.sub || !claims.email) return res.status(401).json({ success: false, message: "Google account could not be verified.", errors: [] });
    let user = await User.findOne({ googleSubject: claims.sub }).select("+googleSubject");
    if (!user) {
      const email = claims.email.toLowerCase();
      const existing = await User.findOne({ email });
      if (existing) return res.status(409).json({ success: false, message: "An account already uses this email. Sign in with that account and link Google from settings.", errors: [] });
      user = await User.create({ name: claims.name || claims.email.split("@")[0], email, password: await bcrypt.hash(crypto.randomBytes(48).toString("hex"), 12), role: ["student", "client"].includes(req.body.role) ? req.body.role : "student", isEmailVerified: true, googleSubject: claims.sub, avatar: claims.picture || "" });
    }
    if (user.status !== "active") return res.status(403).json({ success: false, message: "Your account is unavailable.", errors: [] });
    user.lastLogin = new Date();
    await user.save();
    return res.json({ success: true, message: "Google sign-in successful.", data: { user: formatUser(user), token: generateToken(user) } });
  } catch (error) { return next(error); }
};
