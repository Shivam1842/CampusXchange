import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Notification from "../models/Notification.js";
import Application from "../models/Application.js";
import { notifyUpcomingDeadlines } from "../utils/deadlineNotifications.js";

test("upcoming deadlines notify owners, participants, and applicants only once", async (t) => {
  const projectId = new mongoose.Types.ObjectId();
  const ownerId = new mongoose.Types.ObjectId();
  const participantId = new mongoose.Types.ObjectId();
  const deadline = new Date("2030-01-02T00:00:00.000Z");
  const bulkWrite = t.mock.method(Notification, "bulkWrite", async () => ({}));
  const applicantId = new mongoose.Types.ObjectId();
  t.mock.method(Application, "find", () => ({
    select() {
      return { lean: async () => [{ project: projectId, applicant: applicantId }] };
    },
  }));
  t.mock.method(Project, "find", () => ({
    select() {
      return { lean: async () => [{
        _id: projectId,
        title: "Campus app",
        owner: ownerId,
        participants: [participantId, ownerId],
        applicationDeadline: deadline,
      }] };
    },
  }));

  const operationCount = await notifyUpcomingDeadlines(new Date("2030-01-01T12:00:00.000Z"));

  assert.equal(operationCount, 3);
  assert.equal(bulkWrite.mock.callCount(), 1);
  const [operations] = bulkWrite.mock.calls[0].arguments;
  assert.deepEqual(operations.map((operation) => operation.updateOne.update.$setOnInsert.recipient), [
    String(ownerId),
    String(participantId),
    String(applicantId),
  ]);
  assert.equal(
    operations[0].updateOne.update.$setOnInsert.dedupeKey,
    `deadline:${projectId}:${deadline.toISOString()}:${ownerId}`
  );
});

test("upcoming deadline notifications do not write when no projects are due", async (t) => {
  const bulkWrite = t.mock.method(Notification, "bulkWrite", async () => ({}));
  const applicationsFind = t.mock.method(Application, "find", () => {
    assert.fail("Applications must not be queried when no projects are due.");
  });
  t.mock.method(Project, "find", () => ({
    select() {
      return { lean: async () => [] };
    },
  }));

  assert.equal(await notifyUpcomingDeadlines(new Date("2030-01-01T00:00:00.000Z")), 0);
  assert.equal(bulkWrite.mock.callCount(), 0);
  assert.equal(applicationsFind.mock.callCount(), 0);
});
