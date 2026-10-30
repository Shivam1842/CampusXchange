import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { errorResponse } from "../middleware/errorHandler.js";
import { partnerQuerySchema } from "../utils/profileValidation.js";
import { listApplicationsQuerySchema } from "../utils/applicationValidation.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("NFR-02: query validators reject Mongo operator injection and nested operators", () => {
  for (const value of [{ "$where": "true" }, { search: { "$ne": null } }, { experience: { "$gt": "" } }]) {
    const { error } = partnerQuerySchema.validate(value, { convert: true });
    assert.ok(error, `expected partner query to reject ${JSON.stringify(value)}`);
  }
  assert.ok(listApplicationsQuerySchema.validate({ status: { "$ne": "rejected" } }).error);
});

test("NFR-03: phone viewport and responsive breakpoints are present", () => {
  const html = fs.readFileSync(path.join(root, "Frontend/index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "Frontend/src/index.css"), "utf8");
  assert.match(html, /name=["']viewport["']/i);
  assert.match(css, /min-width:\s*320px/);
  assert.match(css, /@import\s+["']tailwindcss["']/);
  const partners = fs.readFileSync(path.join(root, "Frontend/src/pages/student/Partners.jsx"), "utf8");
  assert.match(partners, /sm:|md:|lg:/);
});

test("NFR-05: expected database and request errors have clear client responses", () => {
  assert.equal(errorResponse(Object.assign(new Error(), { name: "ValidationError" })).status, 400);
  assert.equal(errorResponse(Object.assign(new Error(), { name: "CastError" })).status, 400);
  assert.equal(errorResponse(Object.assign(new Error(), { code: 11000 })).status, 409);
  assert.equal(errorResponse(Object.assign(new SyntaxError(), { status: 400, body: {} })).body.message, "Invalid JSON request body.");
  assert.equal(errorResponse(new Error()).body.message, "An unexpected server error occurred.");
});

test("FR-13/15/03/auth additions are mounted behind their documented API routes", () => {
  const server = fs.readFileSync(path.join(root, "Backend/server.js"), "utf8");
  const auth = fs.readFileSync(path.join(root, "Backend/routes/authRoutes.js"), "utf8");
  const admin = fs.readFileSync(path.join(root, "Backend/routes/adminRoutes.js"), "utf8");
  const profile = fs.readFileSync(path.join(root, "Backend/routes/profileRoutes.js"), "utf8");
  assert.match(server, /api\/v1\/messages/);
  assert.match(server, /api\/v1\/verification-documents/);
  for (const route of ["forgot-password", "reset-password", "verify-email", "google"]) assert.match(auth, new RegExp(route));
  assert.match(admin, /verification-documents/);
  assert.match(profile, /avatar-upload/);
});
