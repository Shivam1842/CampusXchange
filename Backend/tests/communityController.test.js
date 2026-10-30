import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Project from "../models/Project.js";
import Review from "../models/Review.js";
import { createReview } from "../controllers/communityController.js";

const createResponse = () => {
  let statusCode;
  let body;
  return {
    res: {
      status(code) {
        statusCode = code;
        return this;
      },
      json(value) {
        body = value;
        return this;
      },
    },
    getStatus: () => statusCode,
    getBody: () => body,
  };
};

test("review requires all four ratings to be integers from 1 through 5", async (t) => {
  const findOne = t.mock.method(Project, "findOne", () => {
    assert.fail("Invalid ratings must be rejected before project lookup.");
  });
  const { res, getStatus, getBody } = createResponse();

  await createReview({
    body: {
      projectId: new mongoose.Types.ObjectId().toString(),
      revieweeId: new mongoose.Types.ObjectId().toString(),
      overallRating: 5,
      communicationRating: 0,
      technicalSkillsRating: 4,
      professionalismRating: 4,
    },
    user: { _id: new mongoose.Types.ObjectId() },
  }, res, (error) => assert.fail(error));

  assert.equal(getStatus(), 400);
  assert.equal(getBody().errors[0].field, "communicationRating");
  assert.equal(findOne.mock.callCount(), 0);
});

test("only completed project participants can submit a review", async (t) => {
  const owner = new mongoose.Types.ObjectId();
  const outsider = new mongoose.Types.ObjectId();
  const reviewee = new mongoose.Types.ObjectId();
  t.mock.method(Project, "findOne", () => ({
    select: async () => ({ _id: new mongoose.Types.ObjectId(), owner, participants: [reviewee] }),
  }));
  const create = t.mock.method(Review, "create", async () => {
    assert.fail("A non-participant must not create a review.");
  });
  const { res, getStatus, getBody } = createResponse();

  await createReview({
    body: {
      projectId: new mongoose.Types.ObjectId().toString(),
      revieweeId: reviewee.toString(),
      overallRating: 5,
      communicationRating: 5,
      technicalSkillsRating: 5,
      professionalismRating: 5,
    },
    user: { _id: outsider },
  }, res, (error) => assert.fail(error));

  assert.equal(getStatus(), 403);
  assert.match(getBody().message, /project participants/);
  assert.equal(create.mock.callCount(), 0);
});
