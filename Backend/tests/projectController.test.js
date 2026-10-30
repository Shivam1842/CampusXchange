
import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import Project from "../models/Project.js";
import Application from "../models/Application.js";
import Profile from "../models/Profile.js";
import Review from "../models/Review.js";

const originalProfileFind = Profile.find;
const originalReviewAggregate = Review.aggregate;
beforeEach(() => {
  Profile.find = () => ({
    select() {
      return this;
    },
    lean: async () => [],
  });
  Review.aggregate = async () => [];
});
afterEach(() => {
  Profile.find = originalProfileFind;
  Review.aggregate = originalReviewAggregate;
});

// --------------------------------------------------
// updateProject
// --------------------------------------------------

test("updateProject synchronizes maxTeamSize with studentsRequired", async (t) => {
  const { updateProject } = await import("../controllers/projectController.js");
  const projectId = new mongoose.Types.ObjectId().toString();

  const project = {
    _id: projectId,
    owner: new mongoose.Types.ObjectId(),
    maxTeamSize: 5,
    studentsRequired: 5,
    status: "open",
    save: async function () {
      return this;
    },
  };

  t.mock.method(Project, "findOne", async () => project);

  const req = {
    params: { projectId },
    user: { _id: project.owner },
    body: { studentsRequired: 4 },
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

  await updateProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(project.studentsRequired, 4);
  assert.equal(project.maxTeamSize, 4);
  assert.equal(responseBody.success, true);
});

test("updateProject synchronizes studentsRequired when maxTeamSize is updated", async (t) => {
  const { updateProject } = await import("../controllers/projectController.js");

  const project = {
    _id: new mongoose.Types.ObjectId(),
    owner: new mongoose.Types.ObjectId(),
    maxTeamSize: 5,
    studentsRequired: 5,
    status: "open",
    save: async function () {
      return this;
    },
  };

  t.mock.method(Project, "findOne", async () => project);

  const req = {
    params: { projectId: project._id.toString() },
    user: { _id: project.owner },
    body: { maxTeamSize: 12 },
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

  await updateProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(project.maxTeamSize, 12);
  assert.equal(project.studentsRequired, 12);
  assert.equal(responseBody.success, true);
});

test("updateProject rejects an invalid project ID without querying the database", async (t) => {
  const { updateProject } = await import("../controllers/projectController.js");

  let findOneCalled = false;

  t.mock.method(Project, "findOne", async () => {
    findOneCalled = true;
    return null;
  });

  const req = {
    params: { projectId: "invalid-id" },
    user: { _id: new mongoose.Types.ObjectId() },
    body: { title: "Updated project title" },
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

  await updateProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.message, "Invalid project ID.");
  assert.equal(findOneCalled, false);
});

test("updateProject rejects invalid update data without querying the database", async (t) => {
  const { updateProject } = await import("../controllers/projectController.js");

  let findOneCalled = false;

  t.mock.method(Project, "findOne", async () => {
    findOneCalled = true;
    return null;
  });

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
    body: { unknownField: "not allowed" },
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

  await updateProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(responseBody.message, "Project validation failed.");
  assert.ok(Array.isArray(responseBody.errors));
  assert.equal(findOneCalled, false);
});

test("updateProject returns 404 when the project is not owned by the current user", async (t) => {
  const { updateProject } = await import("../controllers/projectController.js");

  t.mock.method(Project, "findOne", async () => null);

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
    body: { title: "Updated Campus Project" },
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

  await updateProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 404);
  assert.equal(
    responseBody.message,
    "Project not found or you are not its owner."
  );
});

test("updateProject rejects an invalid project status transition", async (t) => {
  const { updateProject } = await import("../controllers/projectController.js");

  const project = {
    _id: new mongoose.Types.ObjectId(),
    owner: new mongoose.Types.ObjectId(),
    status: "completed",
    save: async () => {
      assert.fail("Project must not be saved after an invalid status transition");
    },
  };

  t.mock.method(Project, "findOne", async () => project);

  const req = {
    params: { projectId: project._id.toString() },
    user: { _id: project.owner },
    body: { status: "open" },
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

  await updateProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(
    responseBody.message,
    "Cannot change project status from 'completed' to 'open'."
  );
});

test("updateProject prevents completion when no applicant has been selected", async (t) => {
  const { updateProject } = await import("../controllers/projectController.js");

  const project = {
    _id: new mongoose.Types.ObjectId(),
    owner: new mongoose.Types.ObjectId(),
    status: "under_review",
    save: async () => {
      assert.fail("Project must not be saved when completion requirements fail");
    },
  };

  let capturedApplicationFilter;

  t.mock.method(Project, "findOne", async () => project);

  t.mock.method(Application, "countDocuments", async (filter) => {
    capturedApplicationFilter = filter;
    return 0;
  });

  const req = {
    params: { projectId: project._id.toString() },
    user: { _id: project.owner },
    body: { status: "completed" },
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

  await updateProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(
    responseBody.message,
    "A project must have at least one selected applicant before it can be completed."
  );
  assert.equal(
    String(capturedApplicationFilter.project),
    project._id.toString()
  );
  assert.deepEqual(capturedApplicationFilter.status, {
    $in: ["selected", "accepted"],
  });
});

// --------------------------------------------------
// createProject
// --------------------------------------------------

test("createProject rejects invalid data without creating a project", async (t) => {
  const { createProject } = await import("../controllers/projectController.js");

  let createCalled = false;

  t.mock.method(Project, "create", async () => {
    createCalled = true;
    return {};
  });

  const req = {
    body: { title: "" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

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

  await createProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(createCalled, false);
});

test("createProject creates a project owned by the authenticated client", async (t) => {
  const { createProject } = await import("../controllers/projectController.js");

  const ownerId = new mongoose.Types.ObjectId();
  let createdProject;

  t.mock.method(Project, "create", async (data) => {
    createdProject = data;
    return { _id: new mongoose.Types.ObjectId(), ...data };
  });

  const req = {
    body: {
      title: "Campus Skill Marketplace",
      description:
        "A platform where students collaborate, exchange skills, and build projects.",
      category: "Technology",
    },
    user: { _id: ownerId },
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

  await createProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 201);
  assert.equal(createdProject.title, "Campus Skill Marketplace");
  assert.equal(createdProject.status, "open");
  assert.equal(String(createdProject.owner), String(ownerId));
  assert.ok(responseBody);
});

// --------------------------------------------------
// deleteProject
// --------------------------------------------------

test("deleteProject rejects an invalid project ID without querying the database", async (t) => {
  const { deleteProject } = await import("../controllers/projectController.js");

  let findOneCalled = false;
  let existsCalled = false;

  t.mock.method(Project, "findOne", async () => {
    findOneCalled = true;
    return null;
  });

  t.mock.method(Application, "exists", async () => {
    existsCalled = true;
    return null;
  });

  const req = {
    params: { projectId: "invalid-id" },
    user: { _id: new mongoose.Types.ObjectId() },
  };

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

  await deleteProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(findOneCalled, false);
  assert.equal(existsCalled, false);
});

test("deleteProject returns 404 when the project is not owned by the current user", async (t) => {
  const { deleteProject } = await import("../controllers/projectController.js");

  let existsCalled = false;

  t.mock.method(Project, "findOne", async () => null);

  t.mock.method(Application, "exists", async () => {
    existsCalled = true;
    return null;
  });

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
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

  await deleteProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 404);
  assert.equal(
    responseBody.message,
    "Project not found or you are not its owner."
  );
  assert.equal(existsCalled, false);
});

test("deleteProject prevents deletion when application history exists", async (t) => {
  const { deleteProject } = await import("../controllers/projectController.js");

  const project = {
    _id: new mongoose.Types.ObjectId(),
    deleteOne: async () => {
      assert.fail("Project must not be deleted when application history exists");
    },
  };

  t.mock.method(Project, "findOne", async () => project);
  t.mock.method(Application, "exists", async () => ({
    _id: new mongoose.Types.ObjectId(),
  }));

  const req = {
    params: { projectId: project._id.toString() },
    user: { _id: new mongoose.Types.ObjectId() },
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

  await deleteProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 409);
  assert.equal(
    responseBody.message,
    "This project has application history and cannot be deleted. Cancel the project instead."
  );
});

test("deleteProject deletes an owned project with no application history", async (t) => {
  const { deleteProject } = await import("../controllers/projectController.js");

  let deleteCalled = false;

  const project = {
    _id: new mongoose.Types.ObjectId(),
    deleteOne: async function () {
      deleteCalled = true;
    },
  };

  t.mock.method(Project, "findOne", async () => project);
  t.mock.method(Application, "exists", async () => null);

  const req = {
    params: { projectId: project._id.toString() },
    user: { _id: new mongoose.Types.ObjectId() },
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

  await deleteProject(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(deleteCalled, true);
  assert.equal(responseBody.success, true);
  assert.equal(responseBody.message, "Project deleted successfully.");
});

// --------------------------------------------------
// getProjects
// --------------------------------------------------

test("getProjects returns open projects with pagination metadata", async (t) => {
  const { getProjects } = await import("../controllers/projectController.js");

  const projects = [
    { _id: new mongoose.Types.ObjectId(), title: "AI Project" },
    { _id: new mongoose.Types.ObjectId(), title: "Web Project" },
  ];

  let capturedFilter;
  let capturedCountFilter;

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
    lean: async () => projects,
  };

  t.mock.method(Project, "find", (filter) => {
    capturedFilter = filter;
    return query;
  });

  t.mock.method(Project, "countDocuments", async (filter) => {
    capturedCountFilter = filter;
    return 2;
  });

  const req = { query: {} };

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

  await getProjects(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.deepEqual(responseBody.data.projects, projects);
  assert.deepEqual(responseBody.data.pagination, {
    total: 2,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  assert.equal(capturedFilter.status, "open");
  assert.deepEqual(capturedFilter, capturedCountFilter);
});

test("getProjects rejects invalid pagination without querying the database", async (t) => {
  const { getProjects } = await import("../controllers/projectController.js");

  let findCalled = false;
  let countCalled = false;

  t.mock.method(Project, "find", () => {
    findCalled = true;
    return {};
  });

  t.mock.method(Project, "countDocuments", async () => {
    countCalled = true;
    return 0;
  });

  const req = { query: { page: "0" } };

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

  await getProjects(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(findCalled, false);
  assert.equal(countCalled, false);
  assert.ok(responseBody);
});

test("getProjects returns an empty list for non-open status without querying the database", async (t) => {
  const { getProjects } = await import("../controllers/projectController.js");

  let findCalled = false;
  let countCalled = false;

  t.mock.method(Project, "find", () => {
    findCalled = true;
    return {};
  });

  t.mock.method(Project, "countDocuments", async () => {
    countCalled = true;
    return 0;
  });

  const req = { query: { status: "completed" } };

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

  await getProjects(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(findCalled, false);
  assert.equal(countCalled, false);
  assert.deepEqual(responseBody.data.projects, []);
  assert.equal(responseBody.data.pagination.total, 0);
});

// --------------------------------------------------
// getMyProjects
// --------------------------------------------------

test("getMyProjects returns only the authenticated owner's projects with pagination", async (t) => {
  const { getMyProjects } = await import("../controllers/projectController.js");

  const ownerId = new mongoose.Types.ObjectId();
  const projects = [
    { _id: new mongoose.Types.ObjectId(), title: "My Project" },
  ];

  let capturedFilter;
  let capturedCountFilter;
  let capturedSkip;
  let capturedLimit;

  const query = {
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
    lean: async () => projects,
  };

  t.mock.method(Project, "find", (filter) => {
    capturedFilter = filter;
    return query;
  });

  t.mock.method(Project, "countDocuments", async (filter) => {
    capturedCountFilter = filter;
    return 21;
  });

  const req = {
    query: { page: "2", limit: "10" },
    user: { _id: ownerId },
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

  await getMyProjects(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.deepEqual(responseBody.data.projects, projects);
  assert.deepEqual(responseBody.data.pagination, {
    total: 21,
    page: 2,
    limit: 10,
    totalPages: 3,
  });

  assert.equal(String(capturedFilter.owner), String(ownerId));
  assert.deepEqual(capturedFilter, capturedCountFilter);
  assert.equal(capturedSkip, 10);
  assert.equal(capturedLimit, 10);
});

test("getMyProjects rejects invalid filters without querying the database", async (t) => {
  const { getMyProjects } = await import("../controllers/projectController.js");

  let findCalled = false;
  let countCalled = false;

  t.mock.method(Project, "find", () => {
    findCalled = true;
    return {};
  });

  t.mock.method(Project, "countDocuments", async () => {
    countCalled = true;
    return 0;
  });

  const req = {
    query: { status: "not-a-valid-status" },
    user: { _id: new mongoose.Types.ObjectId() },
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

  await getMyProjects(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(findCalled, false);
  assert.equal(countCalled, false);
  assert.equal(responseBody.success, false);
  assert.equal(responseBody.message, "Invalid project filters.");
});

// --------------------------------------------------
// getMyProjectById
// --------------------------------------------------

test("getMyProjectById returns a project belonging to the authenticated owner", async (t) => {
  const { getMyProjectById } = await import("../controllers/projectController.js");

  const ownerId = new mongoose.Types.ObjectId();
  const projectId = new mongoose.Types.ObjectId();

  const project = {
    _id: projectId,
    owner: ownerId,
    title: "My Campus Project",
  };

  let capturedFilter;

  const query = {
    lean: async () => project,
  };

  t.mock.method(Project, "findOne", (filter) => {
    capturedFilter = filter;
    return query;
  });

  const req = {
    params: { projectId: projectId.toString() },
    user: { _id: ownerId },
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

  await getMyProjectById(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.equal(responseBody.data.project, project);
  assert.equal(String(capturedFilter._id), projectId.toString());
  assert.equal(String(capturedFilter.owner), ownerId.toString());
});

test("getMyProjectById rejects an invalid project ID without querying the database", async (t) => {
  const { getMyProjectById } = await import("../controllers/projectController.js");

  let findOneCalled = false;

  t.mock.method(Project, "findOne", () => {
    findOneCalled = true;
    return {
      lean: async () => null,
    };
  });

  const req = {
    params: { projectId: "invalid-id" },
    user: { _id: new mongoose.Types.ObjectId() },
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

  await getMyProjectById(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(findOneCalled, false);
  assert.equal(responseBody.success, false);
});

test("getMyProjectById returns 404 when the project is not owned by the user", async (t) => {
  const { getMyProjectById } = await import("../controllers/projectController.js");

  t.mock.method(Project, "findOne", () => ({
    lean: async () => null,
  }));

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
    user: { _id: new mongoose.Types.ObjectId() },
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

  await getMyProjectById(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 404);
  assert.equal(responseBody.success, false);
  assert.equal(
    responseBody.message,
    "Project not found or you are not its owner."
  );
});

// --------------------------------------------------
// getProjectById
// --------------------------------------------------

test("getProjectById returns a publicly available project", async (t) => {
  const { getProjectById } = await import("../controllers/projectController.js");

  const projectId = new mongoose.Types.ObjectId();

  const project = {
    _id: projectId,
    title: "Campus Skill Marketplace",
    status: "open",
  };

  let capturedFilter;

  const query = {
    populate() {
      return this;
    },
    lean: async () => project,
  };

  t.mock.method(Project, "findOne", (filter) => {
    capturedFilter = filter;
    return query;
  });

  const req = {
    params: { projectId: projectId.toString() },
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

  await getProjectById(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.deepEqual(responseBody.data.project, project);
  assert.equal(String(capturedFilter._id), projectId.toString());
  assert.equal(capturedFilter.status, "open");
});

test("getProjectById rejects an invalid project ID without querying the database", async (t) => {
  const { getProjectById } = await import("../controllers/projectController.js");

  let findOneCalled = false;

  t.mock.method(Project, "findOne", () => {
    findOneCalled = true;
    return {
      populate() {
        return this;
      },
      lean: async () => null,
    };
  });

  const req = {
    params: { projectId: "invalid-id" },
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

  await getProjectById(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 400);
  assert.equal(findOneCalled, false);
  assert.equal(responseBody.success, false);
});

test("getProjectById returns 404 when a project is not publicly available", async (t) => {
  const { getProjectById } = await import("../controllers/projectController.js");

  t.mock.method(Project, "findOne", () => ({
    populate() {
      return this;
    },
    lean: async () => null,
  }));

  const req = {
    params: { projectId: new mongoose.Types.ObjectId().toString() },
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

  await getProjectById(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 404);
  assert.equal(responseBody.success, false);
});

// --------------------------------------------------
// Additional getProjects filter test
// --------------------------------------------------

test("getProjects applies category, owner, and search filters consistently", async (t) => {
  const { getProjects } = await import("../controllers/projectController.js");

  const ownerId = new mongoose.Types.ObjectId();
  const projects = [
    { _id: new mongoose.Types.ObjectId(), title: "Web Project" },
  ];

  let capturedFindFilter;
  let capturedCountFilter;

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
    lean: async () => projects,
  };

  t.mock.method(Project, "find", (filter) => {
    capturedFindFilter = filter;
    return query;
  });

  t.mock.method(Project, "countDocuments", async (filter) => {
    capturedCountFilter = filter;
    return 1;
  });

  const req = {
    query: {
      category: "Web Development",
      owner: ownerId.toString(),
      search: "campus",
    },
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

  await getProjects(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(statusCode, 200);
  assert.equal(responseBody.success, true);
  assert.deepEqual(responseBody.data.projects, projects);

  assert.equal(capturedFindFilter.status, "open");
  assert.ok(capturedFindFilter.category instanceof RegExp);
  assert.equal(capturedFindFilter.category.source, "^Web Development$");
  assert.equal(capturedFindFilter.category.flags, "i");
  assert.equal(String(capturedFindFilter.owner), ownerId.toString());
  assert.deepEqual(capturedFindFilter.$text, { $search: "campus" });

  assert.deepEqual(capturedCountFilter, capturedFindFilter);
});
