import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { mock } from "node:test";
import mongoose from "mongoose";
import { createApplication } from "../controllers/applicationController.js";
import Profile from "../models/Profile.js";
import Review from "../models/Review.js";
import Notification from "../models/Notification.js";
import Team from "../models/Team.js";

const originalProfileFindOne = Profile.findOne;
const originalProfileFind = Profile.find;
const originalReviewAggregate = Review.aggregate;
const originalNotificationCreate = Notification.create;
const originalNotificationInsertMany = Notification.insertMany;
const originalTeamFindById = Team.findById;
beforeEach(() => {
  Profile.findOne = () => ({
    select() {
      return this;
    },
    lean: async () => null,
  });
  Profile.find = () => ({
    select() {
      return this;
    },
    lean: async () => [],
  });
  Review.aggregate = async () => [];
  Notification.create = async () => ({});
  Notification.insertMany = async () => [];
  Team.findById = () => ({
    session() {
      return this;
    },
    select: async () => null,
  });
});
afterEach(() => {
  Profile.findOne = originalProfileFindOne;
  Profile.find = originalProfileFind;
  Review.aggregate = originalReviewAggregate;
  Notification.create = originalNotificationCreate;
  Notification.insertMany = originalNotificationInsertMany;
  Team.findById = originalTeamFindById;
});

test("createApplication rejects an invalid project ID without querying the database", async () => {
  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      portfolioLink: "https://portfolio.example/student",
      skills: ["React", "MongoDB"],
      previousProjects: ["Campus marketplace"],
      availability: "10 hours weekly",
      proposedContribution: "",
    },
    params: { projectId: "invalid-project-id" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  await createApplication(req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Invalid project ID.");
  assert.equal(nextCalled, false);
});

test("createApplication returns 404 when the project does not exist", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const findByIdMock = t.mock.method(
    Project,
    "findById",
    () => ({
      select: async () => null,
    })
  );

  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      proposedContribution: "",
    },
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  await createApplication(req, res, next);

  assert.equal(findByIdMock.mock.callCount(), 1);
  assert.equal(statusCode, 404);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Project not found.");
  assert.equal(nextCalled, false);
});

test("createApplication rejects projects that are not open", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const findByIdMock = t.mock.method(
    Project,
    "findById",
    () => ({
      select: async () => ({
        status: "completed",
        applicationDeadline: null,
      }),
    })
  );

  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      proposedContribution: "",
    },
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = () => {
    nextCalled = true;
  };

  await createApplication(req, res, next);

  assert.equal(findByIdMock.mock.callCount(), 1);
  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(
    responseBody.message,
    "This project is not accepting applications."
  );
  assert.equal(nextCalled, false);
});

test("createApplication rejects an expired application deadline", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const ApplicationModel = (await import("../models/Application.js")).default;

  t.mock.method(Project, "findById", () => ({
    select: async () => ({
      _id: new mongoose.Types.ObjectId(),
      status: "open",
      applicationDeadline: new Date(Date.now() - 60_000),
    }),
  }));

  const createMock = t.mock.method(
    ApplicationModel,
    "create",
    async () => {
      throw new Error("Application.create must not be called");
    }
  );

  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      proposedContribution: "",
    },
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await createApplication(req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "The application deadline has passed.");
  assert.equal(createMock.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("createApplication returns 409 for a duplicate application", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const ApplicationModel = (await import("../models/Application.js")).default;

  t.mock.method(Project, "findById", () => ({
    select: async () => ({
      _id: new mongoose.Types.ObjectId(),
      status: "open",
      applicationDeadline: null,
    }),
  }));

  const duplicateKeyError = Object.assign(
    new Error("Duplicate application"),
    { code: 11000 }
  );

  const createMock = t.mock.method(
    ApplicationModel,
    "create",
    async () => {
      throw duplicateKeyError;
    }
  );

  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      proposedContribution: "",
    },
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await createApplication(req, res, next);

  assert.equal(createMock.mock.callCount(), 1);
  assert.equal(statusCode, 409);
  assert.equal(responseBody.success, false);
  assert.equal(
    responseBody.message,
    "You have already applied to this project."
  );
  assert.equal(nextError, undefined);
});

test("createApplication creates an application for an open project", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const ApplicationModel = (await import("../models/Application.js")).default;

  const projectId = new mongoose.Types.ObjectId();
  const applicantId = new mongoose.Types.ObjectId();
  const createdApplication = {
    _id: new mongoose.Types.ObjectId(),
    project: projectId,
    applicant: applicantId,
    coverLetter: "I am interested in contributing to this project.",
    proposedContribution: "",
    status: "applied",
  };

  t.mock.method(Project, "findById", () => ({
    select: async () => ({
      _id: projectId,
      status: "open",
      applicationDeadline: null,
    }),
  }));

  const createMock = t.mock.method(
    ApplicationModel,
    "create",
    async (data) => {
      assert.equal(data.project, projectId);
      assert.equal(data.applicant, applicantId);
      assert.equal(data.status, "applied");
      assert.equal(data.coverLetter, "I am interested in contributing to this project.");
      assert.equal(data.portfolioLink, "https://portfolio.example/student");
      assert.deepEqual(data.skills, ["React", "MongoDB"]);
      assert.deepEqual(data.previousProjects, ["Campus marketplace"]);
      assert.equal(data.availability, "10 hours weekly");
      return createdApplication;
    }
  );

  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      portfolioLink: "https://portfolio.example/student",
      skills: ["React", "MongoDB"],
      previousProjects: ["Campus marketplace"],
      availability: "10 hours weekly",
      proposedContribution: "",
    },
    params: { projectId: projectId.toString() },
    user: { _id: applicantId },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await createApplication(req, res, next);

  assert.equal(createMock.mock.callCount(), 1);
  assert.equal(statusCode, 201);
  assert.equal(responseBody.success, true);
  assert.equal(
    responseBody.message,
    "Application submitted successfully."
  );
  assert.equal(responseBody.data.application, createdApplication);
  assert.equal(nextError, undefined);
});

test("withdrawApplication rejects an invalid application ID without querying the database", async () => {
  const { withdrawApplication } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const findOneMock = mock.method(ApplicationModel, "findOne", async () => {
    throw new Error("Application.findOne must not be called");
  });

  const req = {
    params: { applicationId: "invalid-application-id" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await withdrawApplication(req, res, next);

  assert.equal(findOneMock.mock.callCount(), 0);
  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Invalid application ID.");
  assert.equal(nextError, undefined);

  findOneMock.mock.restore();
});

test("withdrawApplication returns 404 when the application is not found for the current student", async (t) => {
  const { withdrawApplication } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const findOneMock = t.mock.method(ApplicationModel, "findOne", async () => null);

  const req = {
    params: { applicationId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await withdrawApplication(req, res, next);

  assert.equal(findOneMock.mock.callCount(), 1);
  assert.equal(statusCode, 404);
  assert.equal(responseBody.success, false);
  assert.equal(nextError, undefined);
});

test("withdrawApplication rejects a rejected application without saving it", async (t) => {
  const { withdrawApplication } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const application = {
    status: "rejected",
    save: t.mock.fn(async () => {
      throw new Error("A rejected application must not be saved");
    }),
  };

  t.mock.method(ApplicationModel, "findOne", async () => application);

  const req = {
    params: { applicationId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await withdrawApplication(req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(application.save.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("withdrawApplication withdraws an eligible application and saves it", async (t) => {
  const { withdrawApplication } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const application = {
    status: "applied",
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findOne", async () => application);

  const req = {
    params: { applicationId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await withdrawApplication(req, res, next);

  assert.equal(application.status, "withdrawn");
  assert.equal(application.save.mock.callCount(), 1);
  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects an invalid application ID without querying the database", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const findByIdMock = t.mock.method(ApplicationModel, "findById", async () => {
    throw new Error("Application.findById must not be called");
  });

  const findOneMock = t.mock.method(ApplicationModel, "findOne", async () => {
    throw new Error("Application.findOne must not be called");
  });

  const req = {
    params: { applicationId: "invalid-application-id" },
    body: { status: "under_review" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(findByIdMock.mock.callCount(), 0);
  assert.equal(findOneMock.mock.callCount(), 0);
  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects a direct transition from applied to selected", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;
  const ProjectModel = (await import("../models/Project.js")).default;

  const projectId = new mongoose.Types.ObjectId();
  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "applied",
    project: {
      _id: projectId,
      owner: new mongoose.Types.ObjectId(),
      status: "open",
      studentsRequired: 2,
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(ProjectModel, "updateOne", async () => ({
    matchedCount: 1,
  }));

  const originalStartSession = mongoose.startSession;
  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "selected" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.match(responseBody.message, /Cannot change application status/);
  assert.equal(application.status, "applied");
  assert.equal(application.save.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus returns 404 when the application belongs to another client", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "applied",
    project: {
      _id: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "open",
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "under_review" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 404);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Application not found.");
  assert.equal(application.status, "applied");
  assert.equal(application.save.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects changes to a finalized application", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "rejected",
    project: {
      _id: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "open",
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "under_review" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "This application has already been finalized.");
  assert.equal(application.status, "rejected");
  assert.equal(application.save.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus allows applied to under_review", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "applied",
    project: {
      _id: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "open",
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "under_review" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.equal(application.status, "under_review");
  assert.equal(application.save.mock.callCount(), 1);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus allows under_review to shortlisted", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;

  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "under_review",
    project: {
      _id: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "open",
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "shortlisted" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.equal(application.status, "shortlisted");
  assert.equal(application.save.mock.callCount(), 1);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus selects a shortlisted applicant when capacity is available", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;
  const ProjectModel = (await import("../models/Project.js")).default;

  const projectId = new mongoose.Types.ObjectId();
  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "shortlisted",
    project: {
      _id: projectId,
      owner: new mongoose.Types.ObjectId(),
      status: "open",
      studentsRequired: 1,
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(ApplicationModel, "countDocuments", () => {
    return {
      session() {
        return Promise.resolve(0);
      },
    };
  });

  t.mock.method(ProjectModel, "updateOne", async () => ({
    matchedCount: 1,
  }));

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "selected" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.equal(application.status, "selected");
  assert.equal(application.save.mock.callCount(), 1);
  assert.equal(ApplicationModel.countDocuments.mock.callCount(), 1);

  const updateCalls = ProjectModel.updateOne.mock.calls;
  assert.equal(updateCalls.length, 1);
  assert.deepEqual(updateCalls[0].arguments[1].$set, { status: "in_progress" });
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects selection when project capacity is full", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;
  const ProjectModel = (await import("../models/Project.js")).default;

  const projectId = new mongoose.Types.ObjectId();
  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "shortlisted",
    project: {
      _id: projectId,
      owner: new mongoose.Types.ObjectId(),
      status: "open",
      studentsRequired: 1,
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(ApplicationModel, "countDocuments", () => ({
    session() {
      return Promise.resolve(1);
    },
  }));

  const updateOneMock = t.mock.method(
    ProjectModel,
    "updateOne",
    async () => ({ matchedCount: 1 })
  );

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "selected" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 409);
  assert.equal(responseBody.success, false);
  assert.match(responseBody.message, /selection capacity/i);
  assert.equal(application.status, "shortlisted");
  assert.equal(application.save.mock.callCount(), 0);
  assert.equal(updateOneMock.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects selection when the project is completed", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;
  const ProjectModel = (await import("../models/Project.js")).default;

  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "shortlisted",
    project: {
      _id: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "completed",
      studentsRequired: 1,
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  const updateOneMock = t.mock.method(
    ProjectModel,
    "updateOne",
    async () => ({ matchedCount: 1 })
  );

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "selected" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.match(responseBody.message, /only be reviewed while the project is accepting selections/i);
  assert.equal(application.status, "shortlisted");
  assert.equal(application.save.mock.callCount(), 0);
  assert.equal(updateOneMock.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects selection if the project closes before the write", async (t) => {
  const { updateApplicationStatus } = await import(
    "../controllers/applicationController.js"
  );
  const ApplicationModel = (await import("../models/Application.js")).default;
  const ProjectModel = (await import("../models/Project.js")).default;

  const application = {
    _id: new mongoose.Types.ObjectId(),
    status: "shortlisted",
    project: {
      _id: new mongoose.Types.ObjectId(),
      owner: new mongoose.Types.ObjectId(),
      status: "open",
      studentsRequired: 2,
    },
    save: t.mock.fn(async function () {
      return this;
    }),
  };

  t.mock.method(ApplicationModel, "findById", () => ({
    session() {
      return this;
    },
    populate: async () => application,
  }));

  t.mock.method(ApplicationModel, "countDocuments", () => ({
    session() {
      return Promise.resolve(0);
    },
  }));

  const updateOneMock = t.mock.method(
    ProjectModel,
    "updateOne",
    async () => ({ matchedCount: 0 })
  );

  t.mock.method(mongoose, "startSession", async () => ({
    async withTransaction(callback) {
      await callback();
    },
    async endSession() {},
  }));

  const req = {
    params: { applicationId: application._id.toString() },
    body: { status: "selected" },
    user: { _id: application.project.owner },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  const next = (error) => {
    nextError = error;
  };

  await updateApplicationStatus(req, res, next);

  assert.equal(statusCode, 409);
  assert.equal(responseBody.success, false);
  assert.match(responseBody.message, /project is no longer open/i);
  assert.equal(application.status, "shortlisted");
  assert.equal(application.save.mock.callCount(), 0);
  assert.equal(updateOneMock.mock.callCount(), 1);
  assert.equal(nextError, undefined);
});

test("createApplication forwards unexpected database errors to next", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const databaseError = new Error("Simulated database failure");

  t.mock.method(Project, "findById", () => ({
    select: async () => {
      throw databaseError;
    },
  }));

  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      proposedContribution: "",
    },
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let nextError;
  let statusCode;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };

  await createApplication(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, databaseError);
  assert.equal(statusCode, undefined);
});

test("getMyApplications returns the current student's applications with default pagination", async (t) => {
  const { getMyApplications } = await import(
    "../controllers/applicationController.js"
  );
  const Application = (await import("../models/Application.js")).default;
  const studentId = new mongoose.Types.ObjectId();
  const applications = [{ _id: new mongoose.Types.ObjectId(), status: "applied" }];

  let capturedFilter;
  let capturedSort;
  let capturedSkip;
  let capturedLimit;

  const query = {
    populate() {
      return this;
    },
    sort(value) {
      capturedSort = value;
      return this;
    },
    skip(value) {
      capturedSkip = value;
      return this;
    },
    limit(value) {
      capturedLimit = value;
      return this;
    },
    lean: async () => applications,
  };

  t.mock.method(Application, "find", (filter) => {
    capturedFilter = filter;
    return query;
  });

  t.mock.method(Application, "countDocuments", async () => 1);

  const req = {
    query: {},
    user: { _id: studentId },
  };

  let statusCode;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  let nextError;

  await getMyApplications(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.deepEqual(responseBody.data.applications, applications);
  assert.deepEqual(capturedFilter, { applicant: studentId });
  assert.deepEqual(capturedSort, { createdAt: -1 });
  assert.equal(capturedSkip, 0);
  assert.equal(capturedLimit, 10);
  assert.deepEqual(responseBody.data.pagination, {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  assert.equal(nextError, undefined);
});

test("getMyApplications includes legacy pending applications when filtering by applied", async (t) => {
  const { getMyApplications } = await import(
    "../controllers/applicationController.js"
  );
  const Application = (await import("../models/Application.js")).default;
  const studentId = new mongoose.Types.ObjectId();

  let capturedFilter;

  const query = {
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    lean: async () => [],
  };

  t.mock.method(Application, "find", (filter) => {
    capturedFilter = filter;
    return query;
  });

  t.mock.method(Application, "countDocuments", async () => 0);

  const req = {
    query: { status: "applied" },
    user: { _id: studentId },
  };

  const res = {
    status(code) {
      assert.equal(code, 200);
      return this;
    },
    json(body) {
      assert.equal(body.success, true);
      return this;
    },
  };

  let nextError;

  await getMyApplications(req, res, (error) => {
    nextError = error;
  });

  assert.deepEqual(capturedFilter, {
    applicant: studentId,
    status: { $in: ["applied", "pending"] },
  });
  assert.equal(nextError, undefined);
});

test("getMyApplications applies requested pagination correctly", async (t) => {
  const { getMyApplications } = await import(
    "../controllers/applicationController.js"
  );
  const Application = (await import("../models/Application.js")).default;
  const studentId = new mongoose.Types.ObjectId();

  let capturedSkip;
  let capturedLimit;

  const query = {
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    skip(value) {
      capturedSkip = value;
      return this;
    },
    limit(value) {
      capturedLimit = value;
      return this;
    },
    lean: async () => [],
  };

  t.mock.method(Application, "find", () => query);
  t.mock.method(Application, "countDocuments", async () => 12);

  const req = {
    query: { page: "2", limit: "5" },
    user: { _id: studentId },
  };

  let statusCode;
  let responseBody;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  let nextError;

  await getMyApplications(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 200);
  assert.equal(capturedSkip, 5);
  assert.equal(capturedLimit, 5);
  assert.deepEqual(responseBody.data.pagination, {
    total: 12,
    page: 2,
    limit: 5,
    totalPages: 3,
  });
  assert.equal(nextError, undefined);
});

test("getProjectApplications rejects an invalid project ID without querying the database", async (t) => {
  const { getProjectApplications } = await import("../controllers/applicationController.js");
  const Project = (await import("../models/Project.js")).default;

  let projectQueryCalled = false;
  t.mock.method(Project, "findOne", () => {
    projectQueryCalled = true;
    throw new Error("Database query should not run for an invalid project ID");
  });

  const req = {
    params: { projectId: "invalid-project-id" },
    query: {},
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextCalled = false;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await getProjectApplications(req, res, () => {
    nextCalled = true;
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Invalid project ID.");
  assert.equal(projectQueryCalled, false);
  assert.equal(nextCalled, false);
});

test("getProjectApplications returns 404 when the project is not owned by the current client", async (t) => {
  const { getProjectApplications } = await import("../controllers/applicationController.js");
  const Project = (await import("../models/Project.js")).default;
  const Application = (await import("../models/Application.js")).default;

  t.mock.method(Project, "findOne", () => ({
    select() {
      return Promise.resolve(null);
    },
  }));

  let applicationQueryCalled = false;
  t.mock.method(Application, "find", () => {
    applicationQueryCalled = true;
    throw new Error("Applications should not be queried for an unowned project");
  });

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    query: {},
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await getProjectApplications(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 404);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Project not found.");
  assert.equal(applicationQueryCalled, false);
  assert.equal(nextError, undefined);
});

test("getProjectApplications returns applications for an owned project with default pagination", async (t) => {
  const { getProjectApplications } = await import("../controllers/applicationController.js");
  const Project = (await import("../models/Project.js")).default;
  const Application = (await import("../models/Application.js")).default;

  const clientId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();
  const applications = [{ _id: new mongoose.Types.ObjectId(), project: projectId }];

  let projectFilter;
  let applicationFilter;
  let countFilter;
  let statusCode;
  let responseBody;
  let nextError;

  t.mock.method(Project, "findOne", (filter) => {
    projectFilter = filter;
    return {
      select() {
        return Promise.resolve({ _id: projectId });
      },
    };
  });

  const findChain = {
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    lean() { return Promise.resolve(applications); },
  };

  t.mock.method(Application, "find", (filter) => {
    applicationFilter = filter;
    return findChain;
  });

  t.mock.method(Application, "countDocuments", async (filter) => {
    countFilter = filter;
    return 1;
  });

  const req = {
    params: { projectId: projectId.toString() },
    query: {},
    user: { _id: clientId },
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await getProjectApplications(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 200);
  assert.equal(nextError, undefined);
  assert.deepEqual(projectFilter, { _id: projectId.toString(), owner: clientId });
  assert.deepEqual(applicationFilter, { project: projectId });
  assert.deepEqual(countFilter, { project: projectId });
  assert.deepEqual(responseBody.data.applications, applications.map((application) => ({
    ...application,
    id: String(application._id),
    coverMessage: undefined,
    profile: null,
    team: null,
  })));
  assert.deepEqual(responseBody.data.pagination, {
    total: 1,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
});

test("getProjectApplications includes legacy pending applications when filtering by applied", async (t) => {
  const { getProjectApplications } = await import("../controllers/applicationController.js");
  const Project = (await import("../models/Project.js")).default;
  const Application = (await import("../models/Application.js")).default;

  const projectId = new mongoose.Types.ObjectId();
  const applications = [
    { _id: new mongoose.Types.ObjectId(), status: "applied" },
    { _id: new mongoose.Types.ObjectId(), status: "pending" },
  ];

  let applicationFilter;
  let countFilter;
  let statusCode;
  let responseBody;

  t.mock.method(Project, "findOne", () => ({
    select() {
      return Promise.resolve({ _id: projectId });
    },
  }));

  const findChain = {
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return this; },
    lean() { return Promise.resolve(applications); },
  };

  t.mock.method(Application, "find", (filter) => {
    applicationFilter = filter;
    return findChain;
  });

  t.mock.method(Application, "countDocuments", async (filter) => {
    countFilter = filter;
    return 2;
  });

  const req = {
    params: { projectId: projectId.toString() },
    query: { status: "applied" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await getProjectApplications(req, res, () => {});

  const expectedFilter = {
    project: projectId,
    status: { $in: ["applied", "pending"] },
  };

  assert.equal(statusCode, 200);
  assert.deepEqual(applicationFilter, expectedFilter);
  assert.deepEqual(countFilter, expectedFilter);
  assert.equal(responseBody.data.pagination.total, 2);
});

test("getProjectApplications applies requested pagination correctly", async (t) => {
  const { getProjectApplications } = await import("../controllers/applicationController.js");
  const Project = (await import("../models/Project.js")).default;
  const Application = (await import("../models/Application.js")).default;

  const projectId = new mongoose.Types.ObjectId();
  let requestedSkip;
  let requestedLimit;
  let statusCode;
  let responseBody;

  t.mock.method(Project, "findOne", () => ({
    select() {
      return Promise.resolve({ _id: projectId });
    },
  }));

  const findChain = {
    populate() { return this; },
    sort() { return this; },
    skip(value) {
      requestedSkip = value;
      return this;
    },
    limit(value) {
      requestedLimit = value;
      return this;
    },
    lean() {
      return Promise.resolve([{ _id: new mongoose.Types.ObjectId() }]);
    },
  };

  t.mock.method(Application, "find", () => findChain);
  t.mock.method(Application, "countDocuments", async () => 12);

  const req = {
    params: { projectId: projectId.toString() },
    query: { page: "2", limit: "5" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await getProjectApplications(req, res, () => {});

  assert.equal(statusCode, 200);
  assert.equal(requestedSkip, 5);
  assert.equal(requestedLimit, 5);
  assert.deepEqual(responseBody.data.pagination, {
    total: 12,
    page: 2,
    limit: 5,
    totalPages: 3,
  });
});

test("getProjectApplications forwards unexpected database errors to next", async (t) => {
  const { getProjectApplications } = await import("../controllers/applicationController.js");
  const Project = (await import("../models/Project.js")).default;

  const databaseError = new Error("Simulated project lookup failure");

  t.mock.method(Project, "findOne", () => ({
    select: async () => {
      throw databaseError;
    },
  }));

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    query: {},
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let nextError;
  let statusCode;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };

  await getProjectApplications(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, databaseError);
  assert.equal(statusCode, undefined);
});

test("getProjectApplications rejects an unsupported status without querying the database", async (t) => {
  const { getProjectApplications } = await import("../controllers/applicationController.js");
  const Project = (await import("../models/Project.js")).default;

  let projectQueryCalled = false;

  t.mock.method(Project, "findOne", () => {
    projectQueryCalled = true;
    throw new Error("Project lookup should not run for invalid query parameters");
  });

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    query: { status: "completed" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await getProjectApplications(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(projectQueryCalled, false);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects an unsupported status without querying the database", async (t) => {
  const { updateApplicationStatus } = await import("../controllers/applicationController.js");
  const Application = (await import("../models/Application.js")).default;

  let applicationQueryCalled = false;

  t.mock.method(Application, "findOne", () => {
    applicationQueryCalled = true;
    throw new Error("Application lookup should not run for an unsupported status");
  });

  const req = {
    params: { applicationId: new mongoose.Types.ObjectId().toString() },
    body: { status: "completed" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await updateApplicationStatus(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(applicationQueryCalled, false);
  assert.equal(nextError, undefined);
});

test("updateApplicationStatus rejects a missing status without querying the database", async (t) => {
  const { updateApplicationStatus } = await import("../controllers/applicationController.js");
  const Application = (await import("../models/Application.js")).default;

  let applicationQueryCalled = false;

  t.mock.method(Application, "findOne", () => {
    applicationQueryCalled = true;
    throw new Error("Application lookup should not run when status is missing");
  });

  const req = {
    params: { applicationId: new mongoose.Types.ObjectId().toString() },
    body: {},
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await updateApplicationStatus(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(applicationQueryCalled, false);
  assert.equal(nextError, undefined);
});

test("withdrawApplication rejects an accepted application without saving it", async (t) => {
  const { withdrawApplication } = await import("../controllers/applicationController.js");
  const Application = (await import("../models/Application.js")).default;

  let saveCalled = false;

  const application = {
    status: "accepted",
    async save() {
      saveCalled = true;
    },
  };

  t.mock.method(Application, "findOne", async () => application);

  const req = {
    params: { applicationId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await withdrawApplication(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(application.status, "accepted");
  assert.equal(saveCalled, false);
  assert.equal(nextError, undefined);
});

test("withdrawApplication forwards unexpected database errors to next", async (t) => {
  const { withdrawApplication } = await import("../controllers/applicationController.js");
  const Application = (await import("../models/Application.js")).default;

  const databaseError = new Error("Database connection failed");

  t.mock.method(Application, "findOne", async () => {
    throw databaseError;
  });

  const req = {
    params: { applicationId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await withdrawApplication(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, databaseError);
  assert.equal(statusCode, undefined);
  assert.equal(responseBody, undefined);
});

test("createApplication rejects an invalid request body without querying the database", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const findByIdMock = t.mock.method(Project, "findById", () => {
    throw new Error("Database must not be queried for an invalid request body.");
  });

  const req = {
    body: {
      coverLetter: "",
      proposedContribution: "",
    },
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let statusCode;
  let responseBody;
  let nextError;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      responseBody = body;
      return this;
    },
  };

  await createApplication(req, res, (error) => {
    nextError = error;
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.success, false);
  assert.equal(findByIdMock.mock.callCount(), 0);
  assert.equal(nextError, undefined);
});

test("createApplication forwards application creation errors to next", async (t) => {
  const Project = (await import("../models/Project.js")).default;
  const Application = (await import("../models/Application.js")).default;
  const databaseError = new Error("Simulated application creation failure");

  t.mock.method(Project, "findById", () => ({
    select: async () => ({
      _id: new mongoose.Types.ObjectId(),
      status: "open",
      applicationDeadline: null,
    }),
  }));

  const createMock = t.mock.method(Application, "create", async () => {
    throw databaseError;
  });

  const req = {
    body: {
      coverLetter: "I am interested in contributing to this project.",
      proposedContribution: "",
    },
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
  };

  let nextError;
  let statusCode;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json() {
      return this;
    },
  };

  await createApplication(req, res, (error) => {
    nextError = error;
  });

  assert.equal(createMock.mock.callCount(), 1);
  assert.equal(nextError, databaseError);
  assert.equal(statusCode, undefined);
});
