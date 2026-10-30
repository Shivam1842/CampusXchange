import test from "node:test";
import assert from "node:assert/strict";

import {
  createApplicationSchema,
  listApplicationsQuerySchema,
  updateApplicationStatusSchema,
} from "../utils/applicationValidation.js";

test("valid application data passes validation", () => {
  const result = createApplicationSchema.validate({
    coverLetter: "I am interested in contributing to this project.",
    proposedContribution: "Frontend development",
  });

  assert.equal(result.error, undefined);
});

test("missing cover letter is rejected", () => {
  const result = createApplicationSchema.validate({
    proposedContribution: "Testing",
  });

  assert.ok(result.error);
});

test("cover letter shorter than 20 characters is rejected", () => {
  const result = createApplicationSchema.validate({
    coverLetter: "Too short",
  });

  assert.ok(result.error);
});

test("unknown application fields are rejected", () => {
  const result = createApplicationSchema.validate({
    coverLetter: "I am interested in contributing to this project.",
    unexpectedField: "not allowed",
  });

  assert.ok(result.error);
});

test("empty proposed contribution defaults to an empty string", () => {
  const result = createApplicationSchema.validate({
    coverLetter: "I am interested in contributing to this project.",
  });

  assert.equal(result.error, undefined);
  assert.equal(result.value.proposedContribution, "");
});

test("application list pagination defaults are applied", () => {
  const result = listApplicationsQuerySchema.validate({});

  assert.equal(result.error, undefined);
  assert.equal(result.value.page, 1);
  assert.equal(result.value.limit, 10);
});

test("application list limit cannot exceed 50", () => {
  const result = listApplicationsQuerySchema.validate({
    limit: 51,
  });

  assert.ok(result.error);
});

test("application list page must be a positive integer", () => {
  const result = listApplicationsQuerySchema.validate({
    page: 0,
  });

  assert.ok(result.error);
});

test("valid application status update passes validation", () => {
  const result = updateApplicationStatusSchema.validate({
    status: "shortlisted",
  });

  assert.equal(result.error, undefined);
});

test("invalid application status update is rejected", () => {
  const result = updateApplicationStatusSchema.validate({
    status: "withdrawn",
  });

  assert.ok(result.error);
});

test("extra status update fields are rejected", () => {
  const result = updateApplicationStatusSchema.validate({
    status: "rejected",
    extraField: true,
  });

  assert.ok(result.error);
});

test("application list limit must be at least 1", () => {
  const result = listApplicationsQuerySchema.validate({
    limit: 0,
  });

  assert.ok(result.error);
});

test("application list page must be an integer", () => {
  const result = listApplicationsQuerySchema.validate({
    page: 1.5,
  });

  assert.ok(result.error);
});
