
import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import {
  sendSkillRequest,
  listSkillRequests,
  acceptSkillRequest,
  rejectSkillRequest,
} from "../controllers/skillRequestController.js";
import Notification from "../models/Notification.js";

const originalNotificationCreate = Notification.create;
beforeEach(() => {
  Notification.create = async () => ({});
});
afterEach(() => {
  Notification.create = originalNotificationCreate;
});

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

const createRequestQuery = (result) => ({
  populate() {
    return this;
  },
  then(resolve, reject) {
    return Promise.resolve(result).then(resolve, reject);
  },
});

const createUser = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  role: "student",
  status: "active",
  ...overrides,
});

const createPopulatedRequest = (sender, recipient, overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  status: "pending",
  sender: { _id: sender._id, name: "Sender", avatar: "" },
  recipient: { _id: recipient._id, name: "Recipient", avatar: "" },
  createdAt: new Date(),
  ...overrides,
});

// sendSkillRequest

test("sendSkillRequest rejects non-student users", async (t) => {
  const User = (await import("../models/User.js")).default;
  const findOneMock = t.mock.method(User, "findOne");

  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    {
      user: createUser({ role: "client" }),
      params: { userId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 403);
  assert.equal(getBody().success, false);
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("sendSkillRequest rejects an invalid recipient ID", async () => {
  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    { user: createUser(), params: { userId: "invalid-id" } },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid recipient ID.");
});

test("sendSkillRequest prevents sending a request to yourself", async () => {
  const user = createUser();
  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    { user, params: { userId: user._id.toString() } },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 400);
  assert.equal(
    getBody().message,
    "You cannot send a skill request to yourself."
  );
});

test("sendSkillRequest returns 404 when the active student recipient does not exist", async (t) => {
  const User = (await import("../models/User.js")).default;

  t.mock.method(User, "findOne", () => ({
    select: async () => null,
  }));

  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    {
      user: createUser(),
      params: { userId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Active student recipient not found.");
});

test("sendSkillRequest returns 404 when the recipient has no profile", async (t) => {
  const User = (await import("../models/User.js")).default;
  const Profile = (await import("../models/Profile.js")).default;
  const recipient = createUser();

  t.mock.method(User, "findOne", () => ({
    select: async () => ({ _id: recipient._id }),
  }));
  t.mock.method(Profile, "exists", async () => null);

  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    {
      user: createUser(),
      params: { userId: recipient._id.toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "The student does not have a profile yet.");
});

test("sendSkillRequest returns 409 when a pending request already exists", async (t) => {
  const User = (await import("../models/User.js")).default;
  const Profile = (await import("../models/Profile.js")).default;
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const recipient = createUser();

  t.mock.method(User, "findOne", () => ({
    select: async () => ({ _id: recipient._id }),
  }));
  t.mock.method(Profile, "exists", async () => ({
    _id: new mongoose.Types.ObjectId(),
  }));
  t.mock.method(SkillRequest, "findOne", async () => ({
    _id: new mongoose.Types.ObjectId(),
  }));

  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    {
      user: createUser(),
      params: { userId: recipient._id.toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 409);
  assert.equal(
    getBody().message,
    "A pending request already exists for this student."
  );
});

test("sendSkillRequest creates a request and returns populated user details", async (t) => {
  const User = (await import("../models/User.js")).default;
  const Profile = (await import("../models/Profile.js")).default;
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const sender = createUser();
  const recipient = createUser();
  const saved = createPopulatedRequest(sender, recipient);
  let createInput;

  t.mock.method(User, "findOne", () => ({
    select: async () => ({ _id: recipient._id }),
  }));
  t.mock.method(Profile, "exists", async () => ({
    _id: new mongoose.Types.ObjectId(),
  }));
  t.mock.method(SkillRequest, "findOne", async () => null);
  t.mock.method(SkillRequest, "create", async (input) => {
    createInput = input;
    return { _id: saved._id };
  });
  t.mock.method(SkillRequest, "findById", () =>
    createRequestQuery(saved)
  );

  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    {
      user: sender,
      params: { userId: recipient._id.toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 201);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.request.id, String(saved._id));
  assert.equal(getBody().data.request.sender.id, String(sender._id));
  assert.equal(getBody().data.request.recipient.id, String(recipient._id));
  assert.equal(createInput.sender, sender._id);
  assert.equal(createInput.recipient, recipient._id);
});

test("sendSkillRequest returns 409 when creation hits a duplicate-key error", async (t) => {
  const User = (await import("../models/User.js")).default;
  const Profile = (await import("../models/Profile.js")).default;
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const recipient = createUser();
  const duplicateError = Object.assign(new Error("Duplicate key"), {
    code: 11000,
  });

  t.mock.method(User, "findOne", () => ({
    select: async () => ({ _id: recipient._id }),
  }));
  t.mock.method(Profile, "exists", async () => ({
    _id: recipient._id,
  }));
  t.mock.method(SkillRequest, "findOne", async () => null);
  t.mock.method(SkillRequest, "create", async () => {
    throw duplicateError;
  });

  const { res, getStatus, getBody } = createResponse();

  await sendSkillRequest(
    {
      user: createUser(),
      params: { userId: recipient._id.toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 409);
  assert.equal(
    getBody().message,
    "A pending request already exists for this student."
  );
});

test("sendSkillRequest forwards unexpected database errors to next", async (t) => {
  const User = (await import("../models/User.js")).default;
  const error = new Error("Database unavailable");

  t.mock.method(User, "findOne", () => {
    throw error;
  });

  const { res, getStatus } = createResponse();
  let receivedError;

  await sendSkillRequest(
    {
      user: createUser(),
      params: { userId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    (err) => {
      receivedError = err;
    }
  );

  assert.equal(receivedError, error);
  assert.equal(getStatus(), undefined);
});

// listSkillRequests

test("listSkillRequests returns paginated requests and metadata", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const sender = createUser();
  const recipient = createUser();
  const requests = [createPopulatedRequest(sender, recipient)];
  let receivedFilter;

  const query = {
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    populate() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve(requests).then(resolve, reject);
    },
  };

  t.mock.method(SkillRequest, "find", (filter) => {
    receivedFilter = filter;
    return query;
  });
  t.mock.method(SkillRequest, "countDocuments", async () => 5);

  const { res, getStatus, getBody } = createResponse();

  await listSkillRequests(
    {
      user: sender,
      skillRequestQuery: {
        status: "pending",
        direction: "incoming",
        page: 2,
        limit: 2,
      },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.requests.length, 1);
  assert.deepEqual(receivedFilter, {
    recipient: sender._id,
    status: "pending",
  });
  assert.deepEqual(getBody().meta, {
    page: 2,
    limit: 2,
    total: 5,
    totalPages: 3,
  });
});

test("listSkillRequests rejects non-student users without querying the database", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const findMock = t.mock.method(SkillRequest, "find");

  const { res, getStatus, getBody } = createResponse();

  await listSkillRequests(
    {
      user: createUser({ role: "client" }),
      skillRequestQuery: {
        status: "pending",
        direction: "incoming",
        page: 1,
        limit: 10,
      },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 403);
  assert.equal(getBody().success, false);
  assert.equal(findMock.mock.callCount(), 0);
});

test("listSkillRequests forwards database errors to next", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const error = new Error("Database unavailable");

  t.mock.method(SkillRequest, "find", () => {
    throw error;
  });

  const { res, getStatus } = createResponse();
  let receivedError;

  await listSkillRequests(
    {
      user: createUser(),
      skillRequestQuery: {
        direction: "outgoing",
        page: 1,
        limit: 10,
      },
    },
    res,
    (err) => {
      receivedError = err;
    }
  );

  assert.equal(receivedError, error);
  assert.equal(getStatus(), undefined);
});

test("listSkillRequests filters outgoing requests without a status filter", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const user = createUser();
  let receivedFilter;

  const query = {
    sort() {
      return this;
    },
    skip() {
      return this;
    },
    limit() {
      return this;
    },
    populate() {
      return this;
    },
    then(resolve, reject) {
      return Promise.resolve([]).then(resolve, reject);
    },
  };

  t.mock.method(SkillRequest, "find", (filter) => {
    receivedFilter = filter;
    return query;
  });
  t.mock.method(SkillRequest, "countDocuments", async () => 0);

  const { res, getStatus, getBody } = createResponse();

  await listSkillRequests(
    {
      user,
      skillRequestQuery: {
        direction: "outgoing",
        page: 1,
        limit: 10,
      },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 200);
  assert.deepEqual(receivedFilter, { sender: user._id });
  assert.deepEqual(getBody().data.requests, []);
  assert.equal(getBody().meta.totalPages, 0);
});

// acceptSkillRequest

test("acceptSkillRequest rejects an invalid request ID", async () => {
  const { res, getStatus, getBody } = createResponse();

  await acceptSkillRequest(
    { user: createUser(), params: { requestId: "bad-id" } },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid skill-request ID.");
});

test("acceptSkillRequest returns 404 when no pending incoming request exists", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const findOneAndUpdateMock = t.mock.method(
    SkillRequest,
    "findOneAndUpdate",
    () => createRequestQuery(null)
  );

  const user = createUser();
  const { res, getStatus, getBody } = createResponse();

  await acceptSkillRequest(
    {
      user,
      params: { requestId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Pending incoming request not found.");
  assert.equal(findOneAndUpdateMock.mock.callCount(), 1);
  assert.deepEqual(findOneAndUpdateMock.mock.calls[0].arguments[0], {
    _id: findOneAndUpdateMock.mock.calls[0].arguments[0]._id,
    recipient: user._id,
    status: "pending",
  });
});

test("acceptSkillRequest updates a pending request to accepted", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const sender = createUser();
  const recipient = createUser();
  const saved = createPopulatedRequest(sender, recipient, {
    status: "accepted",
  });
  let updateFilter;
  let updateOperation;

  t.mock.method(SkillRequest, "findOneAndUpdate", (filter, update) => {
    updateFilter = filter;
    updateOperation = update;
    return createRequestQuery(saved);
  });

  const { res, getStatus, getBody } = createResponse();

  await acceptSkillRequest(
    {
      user: recipient,
      params: { requestId: saved._id.toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.request.status, "accepted");
  assert.deepEqual(updateFilter, {
    _id: saved._id.toString(),
    recipient: recipient._id,
    status: "pending",
  });
  assert.deepEqual(updateOperation, {
    $set: { status: "accepted" },
  });
});

test("acceptSkillRequest rejects non-student users without querying the database", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const updateMock = t.mock.method(SkillRequest, "findOneAndUpdate");

  const { res, getStatus, getBody } = createResponse();

  await acceptSkillRequest(
    {
      user: createUser({ role: "client" }),
      params: { requestId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 403);
  assert.equal(getBody().success, false);
  assert.equal(updateMock.mock.callCount(), 0);
});

test("acceptSkillRequest forwards database errors to next", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const error = new Error("Database unavailable");

  t.mock.method(SkillRequest, "findOneAndUpdate", () => {
    throw error;
  });

  const { res, getStatus } = createResponse();
  let receivedError;

  await acceptSkillRequest(
    {
      user: createUser(),
      params: { requestId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    (err) => {
      receivedError = err;
    }
  );

  assert.equal(receivedError, error);
  assert.equal(getStatus(), undefined);
});

// rejectSkillRequest

test("rejectSkillRequest rejects an invalid request ID", async () => {
  const { res, getStatus, getBody } = createResponse();

  await rejectSkillRequest(
    { user: createUser(), params: { requestId: "bad-id" } },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid skill-request ID.");
});

test("rejectSkillRequest updates a pending request to rejected", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const sender = createUser();
  const recipient = createUser();
  const saved = createPopulatedRequest(sender, recipient, {
    status: "rejected",
  });

  t.mock.method(SkillRequest, "findOneAndUpdate", () =>
    createRequestQuery(saved)
  );

  const { res, getStatus, getBody } = createResponse();

  await rejectSkillRequest(
    {
      user: recipient,
      params: { requestId: saved._id.toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.request.status, "rejected");
});

test("rejectSkillRequest rejects non-student users without querying the database", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const updateMock = t.mock.method(SkillRequest, "findOneAndUpdate");

  const { res, getStatus, getBody } = createResponse();

  await rejectSkillRequest(
    {
      user: createUser({ role: "client" }),
      params: { requestId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 403);
  assert.equal(getBody().success, false);
  assert.equal(updateMock.mock.callCount(), 0);
});

test("rejectSkillRequest forwards database errors to next", async (t) => {
  const SkillRequest = (await import("../models/SkillRequest.js")).default;
  const error = new Error("Database unavailable");

  t.mock.method(SkillRequest, "findOneAndUpdate", () => {
    throw error;
  });

  const { res, getStatus } = createResponse();
  let receivedError;

  await rejectSkillRequest(
    {
      user: createUser(),
      params: { requestId: new mongoose.Types.ObjectId().toString() },
    },
    res,
    (err) => {
      receivedError = err;
    }
  );

  assert.equal(receivedError, error);
  assert.equal(getStatus(), undefined);
});
