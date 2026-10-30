import test from "node:test";
import assert from "node:assert/strict";
import User from "../models/User.js";
import {
  register,
  getMe,
  logout,
} from "../controllers/authController.js";

const createResponse = () => {
  let statusCode;
  let responseBody;

  return {
    res: {
      status(code) {
        statusCode = code;
        return this;
      },
      json(body) {
        responseBody = body;
        return this;
      },
    },
    getStatus: () => statusCode,
    getBody: () => responseBody,
  };
};

test("register rejects the admin role without querying the database", async (t) => {
  const findOne = t.mock.method(User, "findOne");

  const req = {
    body: {
      name: "Test User",
      email: "test@example.com",
      password: "StrongPassword123",
      role: "admin",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await register(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 400);
  assert.equal(getBody().success, false);
  assert.equal(getBody().message, "Invalid registration role.");
  assert.equal(findOne.mock.callCount(), 0);
});

test("getMe returns user details without exposing the password", () => {
  const user = {
    _id: "user-123",
    name: "Test User",
    email: "test@example.com",
    role: "student",
    status: "active",
    isVerified: false,
    isEmailVerified: false,
    avatar: "",
    lastLogin: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-02T00:00:00.000Z"),
    password: "must-not-be-returned",
  };

  const req = { user };
  const { res, getStatus, getBody } = createResponse();

  getMe(req, res);

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.user.id, "user-123");
  assert.equal(getBody().data.user.email, "test@example.com");
  assert.equal("password" in getBody().data.user, false);
});

test("logout returns a successful response", () => {
  const { res, getStatus, getBody } = createResponse();

  logout({}, res);

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(
    getBody().message,
    "Logout successful. Please remove your stored token."
  );
});

test("register creates a student account and does not expose the password hash", async (t) => {
  const { default: bcrypt } = await import("bcryptjs");
  const { default: mongoose } = await import("mongoose");

  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = "test-only-secret-for-auth-unit-tests";

  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  });

  t.mock.method(User, "findOne", async () => null);
  t.mock.method(bcrypt, "hash", async () => "test-password-hash");

  const createdUser = {
    _id: new mongoose.Types.ObjectId(),
    name: "Test User",
    email: "test@example.com",
    password: "test-password-hash",
    role: "student",
    status: "active",
    isVerified: false,
    isEmailVerified: false,
    avatar: "",
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const create = t.mock.method(User, "create", async (data) => ({
    ...createdUser,
    ...data,
  }));

  const req = {
    body: {
      name: " Test User ",
      email: " TEST@example.com ",
      password: "StrongPassword123",
      role: "student",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await register(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 201);
  assert.equal(getBody().success, true);
  assert.equal(getBody().message, "Account registered successfully.");
  assert.equal(getBody().data.user.name, "Test User");
  assert.equal(getBody().data.user.email, "test@example.com");
  assert.equal(getBody().data.user.role, "student");
  assert.equal(typeof getBody().data.token, "string");
  assert.ok(getBody().data.token.length > 0);
  assert.equal("password" in getBody().data.user, false);
  assert.equal(create.mock.callCount(), 1);
});

test("register rejects an existing email without hashing or creating a user", async (t) => {
  const bcrypt = await import("bcryptjs");

  t.mock.method(User, "findOne", async () => ({
    _id: "existing-user-id",
    email: "test@example.com",
  }));

  const hash = t.mock.method(bcrypt.default, "hash");
  const create = t.mock.method(User, "create");

  const req = {
    body: {
      name: "Another User",
      email: " TEST@example.com ",
      password: "StrongPassword123",
      role: "student",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await register(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 409);
  assert.equal(getBody().success, false);
  assert.equal(
    getBody().message,
    "An account with this email already exists."
  );
  assert.equal(hash.mock.callCount(), 0);
  assert.equal(create.mock.callCount(), 0);
});

test("login rejects an incorrect password without updating lastLogin", async (t) => {
  const bcrypt = await import("bcryptjs");
  const { login } = await import("../controllers/authController.js");

  const user = {
    _id: "user-123",
    password: "stored-password-hash",
    status: "active",
    lastLogin: null,
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  const select = t.mock.fn(async () => user);
  t.mock.method(User, "findOne", () => ({ select }));
  t.mock.method(bcrypt.default, "compare", async () => false);

  const req = {
    body: {
      email: " TEST@example.com ",
      password: "WrongPassword123",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await login(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 401);
  assert.equal(getBody().success, false);
  assert.equal(getBody().message, "Invalid email or password.");
  assert.equal(user.save.mock.callCount(), 0);
});

test("login succeeds with valid credentials and updates lastLogin", async (t) => {
  const bcrypt = await import("bcryptjs");
  const jwt = await import("jsonwebtoken");
  const { login } = await import("../controllers/authController.js");
  const previousSecret = process.env.JWT_SECRET;

  process.env.JWT_SECRET = "test-only-secret-for-auth-unit-tests";

  t.after(() => {
    if (previousSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = previousSecret;
    }
  });

  const user = {
    _id: "user-123",
    name: "Test User",
    email: "test@example.com",
    password: "stored-password-hash",
    role: "student",
    status: "active",
    isVerified: false,
    isEmailVerified: false,
    avatar: "",
    lastLogin: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  const select = t.mock.fn(async () => user);
  t.mock.method(User, "findOne", () => ({ select }));
  t.mock.method(bcrypt.default, "compare", async () => true);

  const req = {
    body: {
      email: " TEST@example.com ",
      password: "StrongPassword123",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await login(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().message, "Login successful.");
  assert.equal(getBody().data.user.email, "test@example.com");
  assert.equal("password" in getBody().data.user, false);
  assert.equal(typeof getBody().data.token, "string");
  assert.equal(user.save.mock.callCount(), 1);
  assert.ok(user.lastLogin instanceof Date);
  assert.ok(Number.isFinite(jwt.default.decode(getBody().data.token).iat));
});

test("login rejects a suspended account even when the password is correct", async (t) => {
  const bcrypt = await import("bcryptjs");
  const { login } = await import("../controllers/authController.js");

  const user = {
    _id: "suspended-user-123",
    password: "stored-password-hash",
    status: "suspended",
    lastLogin: null,
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  const select = t.mock.fn(async () => user);
  t.mock.method(User, "findOne", () => ({ select }));
  t.mock.method(bcrypt.default, "compare", async () => true);

  const req = {
    body: {
      email: "suspended@example.com",
      password: "StrongPassword123",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await login(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 403);
  assert.equal(getBody().success, false);
  assert.equal(
    getBody().message,
    "Your account is suspended. Please contact support."
  );
  assert.equal(user.save.mock.callCount(), 0);
});

test("changePassword rejects an invalid request without querying the database", async (t) => {
  const { changePassword } = await import("../controllers/authController.js");

  const findById = t.mock.method(User, "findById", () => {
    assert.fail("Database must not be queried for invalid password input");
  });

  const req = {
    user: { _id: "user-123" },
    body: {
      currentPassword: "StrongPassword123",
      newPassword: "short",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await changePassword(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 400);
  assert.equal(getBody().success, false);
  assert.equal(findById.mock.callCount(), 0);
});

test("changePassword updates the password when the current password is correct", async (t) => {
  const bcrypt = await import("bcryptjs");
  const { changePassword } = await import("../controllers/authController.js");

  const user = {
    password: "old-password-hash",
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  const select = t.mock.fn(async () => user);
  t.mock.method(User, "findById", () => ({ select }));
  t.mock.method(bcrypt.default, "compare", async (plainPassword) => {
    return plainPassword === "CurrentPassword123";
  });
  t.mock.method(bcrypt.default, "hash", async (password, rounds) => {
    assert.equal(password, "NewPassword456");
    assert.equal(rounds, 12);
    return "new-password-hash";
  });

  const req = {
    user: { _id: "user-123" },
    body: {
      currentPassword: "CurrentPassword123",
      newPassword: "NewPassword456",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await changePassword(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().message, "Password changed successfully. Please log in again.");
  assert.equal(user.password, "new-password-hash");
  assert.equal(user.save.mock.callCount(), 1);
});

test("changePassword rejects an incorrect current password without saving", async (t) => {
  const bcrypt = await import("bcryptjs");
  const { changePassword } = await import("../controllers/authController.js");

  const user = {
    password: "stored-password-hash",
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  const select = t.mock.fn(async () => user);
  t.mock.method(User, "findById", () => ({ select }));
  t.mock.method(bcrypt.default, "compare", async () => false);

  const req = {
    user: { _id: "user-123" },
    body: {
      currentPassword: "WrongCurrentPassword123",
      newPassword: "NewPassword456",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await changePassword(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 400);
  assert.equal(getBody().success, false);
  assert.equal(getBody().message, "Current password is incorrect.");
  assert.equal(user.save.mock.callCount(), 0);
});

test("changePassword rejects the same password without saving", async (t) => {
  const bcrypt = await import("bcryptjs");
  const { changePassword } = await import("../controllers/authController.js");

  const user = {
    password: "stored-password-hash",
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  const select = t.mock.fn(async () => user);
  t.mock.method(User, "findById", () => ({ select }));
  t.mock.method(bcrypt.default, "compare", async (plainPassword) => {
    return plainPassword === "CurrentPassword123";
  });

  const req = {
    user: { _id: "user-123" },
    body: {
      currentPassword: "CurrentPassword123",
      newPassword: "CurrentPassword123",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await changePassword(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 400);
  assert.equal(getBody().success, false);
  assert.equal(
    getBody().message,
    "Choose a password different from your current password."
  );
  assert.equal(user.save.mock.callCount(), 0);
});

test("changePassword returns 404 when the user account is not found", async (t) => {
  const { changePassword } = await import("../controllers/authController.js");

  const select = t.mock.fn(async () => null);
  t.mock.method(User, "findById", () => ({ select }));

  const req = {
    user: { _id: "missing-user-123" },
    body: {
      currentPassword: "CurrentPassword123",
      newPassword: "NewPassword456",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await changePassword(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 404);
  assert.equal(getBody().success, false);
  assert.equal(getBody().message, "User account not found.");
});

test("changePassword forwards database errors to next", async (t) => {
  const { changePassword } = await import("../controllers/authController.js");
  const databaseError = new Error("Database connection failed");

  const select = t.mock.fn(async () => {
    throw databaseError;
  });

  t.mock.method(User, "findById", () => ({ select }));

  const req = {
    user: { _id: "user-123" },
    body: {
      currentPassword: "CurrentPassword123",
      newPassword: "NewPassword456",
    },
  };

  const { res, getStatus, getBody } = createResponse();
  let forwardedError;

  await changePassword(req, res, (error) => {
    forwardedError = error;
  });

  assert.equal(forwardedError, databaseError);
  assert.equal(getStatus(), undefined);
  assert.equal(getBody(), undefined);
});

test("login rejects an email that does not belong to an account", async (t) => {
  const { login } = await import("../controllers/authController.js");

  const select = t.mock.fn(async () => null);
  const findOne = t.mock.method(User, "findOne", () => ({ select }));

  const req = {
    body: {
      email: "missing@example.com",
      password: "StrongPassword123",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await login(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 401);
  assert.equal(getBody().success, false);
  assert.equal(getBody().message, "Invalid email or password.");
  assert.equal(findOne.mock.callCount(), 1);
});
