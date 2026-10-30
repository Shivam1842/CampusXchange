import test from "node:test";
import assert from "node:assert/strict";
import {
  createProjectSchema,
  updateProjectSchema,
} from "../utils/projectValidation.js";

const validProject = {
  title: "Campus Skill Marketplace",
  description:
    "A platform where students collaborate, exchange skills, and build projects.",
  category: "Technology",
};

test("project creation accepts valid data", () => {
  const { error, value } = createProjectSchema.validate(validProject);

  assert.equal(error, undefined);
  assert.equal(value.title, validProject.title);
});

test("project creation accepts maxTeamSize up to 100", () => {
  const { error } = createProjectSchema.validate({
    ...validProject,
    maxTeamSize: 100,
  });

  assert.equal(error, undefined);
});

test("project creation accepts studentsRequired up to 20", () => {
  const { error } = createProjectSchema.validate({
    ...validProject,
    studentsRequired: 20,
  });

  assert.equal(error, undefined);
});

test("project creation rejects studentsRequired above 20", () => {
  const { error } = createProjectSchema.validate({
    ...validProject,
    studentsRequired: 21,
  });

  assert.ok(error);
});

test("project update accepts valid capacity fields", () => {
  const { error, value } = updateProjectSchema.validate({
    maxTeamSize: 100,
    studentsRequired: 20,
  });

  assert.equal(error, undefined);
  assert.equal(value.maxTeamSize, 100);
  assert.equal(value.studentsRequired, 20);
});

test("project update rejects studentsRequired above 20", () => {
  const { error } = updateProjectSchema.validate({
    studentsRequired: 21,
  });

  assert.ok(error);
});
