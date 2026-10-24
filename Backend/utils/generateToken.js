
import jwt from "jsonwebtoken";

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured in the environment");
  }

  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

export default generateToken;
