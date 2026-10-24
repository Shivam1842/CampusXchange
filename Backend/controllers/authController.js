
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import generateToken from "../utils/generateToken.js";

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
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

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
      });
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Your account is suspended. Please contact support.",
      });
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
      });
    }

    const user = await User.findById(req.user._id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User account not found.",
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
