import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Application from "../models/Application.js";

const validApplication = () => ({
  project: new mongoose.Types.ObjectId(),
  applicant: new mongoose.Types.ObjectId(),
  coverLetter: "I am interested in contributing to this project.",
});

test("application model requires project and applicant", async () => {
  const application = new Application({
    coverLetter: validApplication().coverLetter,
  });

  await assert.rejects(
    application.validate(),
    (error) => {
      assert.ok(error.errors.project);
      assert.ok(error.errors.applicant);
      return true;
    }
  );
});

test("valid application data passes model validation", async () => {
  const application = new Application(validApplication());

  await application.validate();
  assert.equal(application.status, "applied");
  assert.equal(application.proposedContribution, "");
});

test("cover letter shorter than 20 characters is rejected", async () => {
  const application = new Application({
    ...validApplication(),
    coverLetter: "Too short",
  });

  await assert.rejects(application.validate(), (error) => {
    assert.ok(error.errors.coverLetter);
    return true;
  });
});

test("cover letter longer than 3000 characters is rejected", async () => {
  const application = new Application({
    ...validApplication(),
    coverLetter: "a".repeat(3001),
  });

  await assert.rejects(application.validate(), (error) => {
    assert.ok(error.errors.coverLetter);
    return true;
  });
});

test("proposed contribution longer than 1000 characters is rejected", async () => {
  const application = new Application({
    ...validApplication(),
    proposedContribution: "a".repeat(1001),
  });

  await assert.rejects(application.validate(), (error) => {
    assert.ok(error.errors.proposedContribution);
    return true;
  });
});

test("unsupported application status is rejected", async () => {
  const application = new Application({
    ...validApplication(),
    status: "approved",
  });

  await assert.rejects(application.validate(), (error) => {
    assert.ok(error.errors.status);
    return true;
  });
});

test("application schema defines a unique project-applicant index", () => {
  const index = Application.schema.indexes().find(
    ([keys, options]) =>
      keys.project === 1 &&
      keys.applicant === 1 &&
      options.unique === true
  );

  assert.ok(index);
});

test("application schema enables timestamps", () => {
  assert.equal(Application.schema.options.timestamps, true);
});
