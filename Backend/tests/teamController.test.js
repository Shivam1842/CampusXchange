
import test from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";

import {
  createTeam,
  getTeams,
  getTeamById,
} from "../controllers/teamController.js";

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

const createQuery = (result) => ({
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
  then(resolve, reject) {
    return Promise.resolve(result).then(resolve, reject);
  },
});

const makeTeam = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name: "AI Study Team",
  description: "A team for AI projects",
  skills: ["JavaScript", "Python"],
  owner: new mongoose.Types.ObjectId(),
  members: [],
  status: "forming",
  ...overrides,
});

// -----------------------------------------------------------------------------
// createTeam
// -----------------------------------------------------------------------------

test("createTeam rejects invalid input without creating a team", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const createMock = t.mock.method(Team, "create");

  const { res, getStatus, getBody } = createResponse();

  await createTeam(
    {
      body: { name: "AI" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().success, false);
  assert.equal(createMock.mock.callCount(), 0);
});

test("createTeam creates a forming team with the owner as its first member", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const ownerId = new mongoose.Types.ObjectId();
  const team = makeTeam({ owner: ownerId });

  let createInput;

  t.mock.method(Team, "create", async (input) => {
    createInput = input;
    return { _id: team._id };
  });

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await createTeam(
    {
      body: {
        name: "  AI Study Team  ",
        description: "  Build AI projects  ",
        skills: [" Python ", "JavaScript"],
      },
      user: { _id: ownerId },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 201);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.team, team);
  assert.equal(createInput.name, "AI Study Team");
  assert.equal(createInput.description, "Build AI projects");
  assert.deepEqual(createInput.skills, ["Python", "JavaScript"]);
  assert.equal(createInput.owner, ownerId);
  assert.deepEqual(createInput.members, [{ user: ownerId, role: "owner" }]);
  assert.equal(createInput.status, "forming");
});

test("createTeam forwards database errors to next", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const databaseError = new Error("Database unavailable");
  let forwardedError;

  t.mock.method(Team, "create", async () => {
    throw databaseError;
  });

  const { res, getStatus } = createResponse();

  await createTeam(
    {
      body: { name: "AI Study Team" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

test("createTeam forwards errors when populating the created team", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const databaseError = new Error("Population failed");
  let forwardedError;

  t.mock.method(Team, "create", async () => ({
    _id: new mongoose.Types.ObjectId(),
  }));

  t.mock.method(Team, "findById", () => {
    throw databaseError;
  });

  const { res, getStatus } = createResponse();

  await createTeam(
    {
      body: { name: "AI Study Team" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

// -----------------------------------------------------------------------------
// getTeams
// -----------------------------------------------------------------------------

test("getTeams applies default pagination and returns metadata", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const teams = [makeTeam()];
  let receivedFilter;
  let receivedSkip;
  let receivedLimit;

  t.mock.method(Team, "find", (filter) => {
    receivedFilter = filter;

    return {
      sort() {
        return {
          skip(value) {
            receivedSkip = value;
            return {
              limit(value) {
                receivedLimit = value;
                return createQuery(teams);
              },
            };
          },
        };
      },
    };
  });

  t.mock.method(Team, "countDocuments", async () => 21);

  const { res, getStatus, getBody } = createResponse();

  await getTeams({ query: {} }, res, (error) => {
    assert.fail(error);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.deepEqual(receivedFilter, {});
  assert.equal(receivedSkip, 0);
  assert.equal(receivedLimit, 10);
  assert.deepEqual(getBody().data.pagination, {
    page: 1,
    limit: 10,
    total: 21,
    totalPages: 3,
  });
});

test("getTeams filters by status and escapes search text", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  let receivedFilter;

  t.mock.method(Team, "find", (filter) => {
    receivedFilter = filter;

    return {
      sort() {
        return {
          skip() {
            return {
              limit() {
                return createQuery([]);
              },
            };
          },
        };
      },
    };
  });

  t.mock.method(Team, "countDocuments", async () => 0);

  const { res, getStatus, getBody } = createResponse();

  await getTeams(
    {
      query: {
        page: "2",
        limit: "5",
        status: "active",
        search: "AI.*",
      },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(receivedFilter.status, "active");
  assert.equal(receivedFilter.$or.length, 3);
  assert.equal(receivedFilter.$or[0].name.$regex, "AI\\.\\*");
  assert.equal(receivedFilter.$or[0].name.$options, "i");
  assert.equal(getBody().data.pagination.page, 2);
  assert.equal(getBody().data.pagination.limit, 5);
});

test("getTeams applies status filtering without search", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  let receivedFilter;

  t.mock.method(Team, "find", (filter) => {
    receivedFilter = filter;

    return {
      sort() {
        return {
          skip() {
            return {
              limit() {
                return createQuery([]);
              },
            };
          },
        };
      },
    };
  });

  t.mock.method(Team, "countDocuments", async () => 0);

  const { res, getStatus } = createResponse();

  await getTeams(
    { query: { status: "forming" } },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.deepEqual(receivedFilter, { status: "forming" });
});

test("getTeams applies search without a status filter", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  let receivedFilter;

  t.mock.method(Team, "find", (filter) => {
    receivedFilter = filter;

    return {
      sort() {
        return {
          skip() {
            return {
              limit() {
                return createQuery([]);
              },
            };
          },
        };
      },
    };
  });

  t.mock.method(Team, "countDocuments", async () => 0);

  const { res, getStatus } = createResponse();

  await getTeams(
    { query: { search: "Python" } },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(receivedFilter.status, undefined);
  assert.equal(receivedFilter.$or.length, 3);
  assert.equal(receivedFilter.$or[1].description.$regex, "Python");
});

test("getTeams rejects invalid query parameters", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const findMock = t.mock.method(Team, "find");

  const { res, getStatus, getBody } = createResponse();

  await getTeams(
    { query: { page: "0", unknown: "value" } },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().success, false);
  assert.equal(findMock.mock.callCount(), 0);
});

test("getTeams forwards errors from the database query", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const databaseError = new Error("Database unavailable");
  let forwardedError;

  t.mock.method(Team, "find", () => {
    throw databaseError;
  });

  const { res, getStatus } = createResponse();

  await getTeams(
    { query: {} },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

test("getTeams forwards errors from countDocuments", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const databaseError = new Error("Count failed");
  let forwardedError;

  t.mock.method(Team, "find", () => ({
    sort() {
      return {
        skip() {
          return {
            limit() {
              return createQuery([]);
            },
          };
        },
      };
    },
  }));

  t.mock.method(Team, "countDocuments", async () => {
    throw databaseError;
  });

  const { res, getStatus } = createResponse();

  await getTeams(
    { query: {} },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

// -----------------------------------------------------------------------------
// getTeamById
// -----------------------------------------------------------------------------

test("getTeamById rejects an invalid ID without querying the database", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const findByIdMock = t.mock.method(Team, "findById");

  const { res, getStatus, getBody } = createResponse();

  await getTeamById(
    { params: { teamId: "invalid-id" } },
    res,
    () => assert.fail("next should not be called")
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid team ID.");
  assert.equal(findByIdMock.mock.callCount(), 0);
});

test("getTeamById returns 404 when the team does not exist", async (t) => {
  const Team = (await import("../models/Team.js")).default;

  t.mock.method(Team, "findById", () => createQuery(null));

  const { res, getStatus, getBody } = createResponse();

  await getTeamById(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Team not found.");
});

test("getTeamById returns the requested team", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await getTeamById(
    {
      params: { teamId: team._id.toString() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.team, team);
});

test("getTeamById forwards database errors to next", async (t) => {
  const Team = (await import("../models/Team.js")).default;
  const databaseError = new Error("Database unavailable");
  let forwardedError;

  t.mock.method(Team, "findById", () => {
    throw databaseError;
  });

  const { res, getStatus } = createResponse();

  await getTeamById(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

// -----------------------------------------------------------------------------
// updateTeam
// -----------------------------------------------------------------------------

test("updateTeam rejects an invalid team ID", async () => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const { res, getStatus, getBody } = createResponse();

  await updateTeam(
    {
      params: { teamId: "invalid-id" },
      body: {},
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid team ID.");
});

test("updateTeam rejects invalid input without querying the database", async (t) => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findOneMock = t.mock.method(Team, "findOne");

  const { res, getStatus } = createResponse();

  await updateTeam(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      body: { name: "x" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("updateTeam rejects attempts to change status through the details endpoint", async (t) => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findOneMock = t.mock.method(Team, "findOne");

  const { res, getStatus, getBody } = createResponse();

  await updateTeam(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      body: { status: "active" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(
    getBody().message,
    "Use the dedicated status endpoint to change team status."
  );
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("updateTeam returns 404 when the current user does not own the team", async (t) => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;

  t.mock.method(Team, "findOne", async () => null);

  const { res, getStatus, getBody } = createResponse();

  await updateTeam(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      body: { name: "Updated AI Team" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Team not found.");
});

test("updateTeam saves valid changes for the owner", async (t) => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);
  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await updateTeam(
    {
      params: { teamId: team._id.toString() },
      body: { name: "Updated AI Team" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(team.name, "Updated AI Team");
  assert.equal(saved, true);
  assert.equal(getBody().message, "Team updated successfully.");
});

test("updateTeam prevents updating a disbanded team", async (t) => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "disbanded" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus, getBody } = createResponse();

  await updateTeam(
    {
      params: { teamId: team._id.toString() },
      body: { name: "Updated AI Team" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "A disbanded team cannot be updated.");
  assert.equal(saved, false);
});

test("updateTeam forwards save errors to next", async (t) => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  const databaseError = new Error("Database unavailable");
  let forwardedError;

  team.save = async () => {
    throw databaseError;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus } = createResponse();

  await updateTeam(
    {
      params: { teamId: team._id.toString() },
      body: { name: "Updated AI Team" },
      user: { _id: team.owner },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

test("updateTeam forwards errors when loading the populated team", async (t) => {
  const { updateTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  const databaseError = new Error("Population failed");
  let forwardedError;

  team.save = async () => {};

  t.mock.method(Team, "findOne", async () => team);
  t.mock.method(Team, "findById", () => {
    throw databaseError;
  });

  const { res, getStatus } = createResponse();

  await updateTeam(
    {
      params: { teamId: team._id.toString() },
      body: { name: "Updated AI Team" },
      user: { _id: team.owner },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

// -----------------------------------------------------------------------------
// updateTeamStatus
// -----------------------------------------------------------------------------

test("updateTeamStatus rejects an invalid team ID without querying the database", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findOneMock = t.mock.method(Team, "findOne");

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: "invalid-id" },
      body: { status: "active" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid team ID.");
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("updateTeamStatus rejects invalid status input", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findOneMock = t.mock.method(Team, "findOne");

  const { res, getStatus } = createResponse();

  await updateTeamStatus(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      body: { status: "unknown-status" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("updateTeamStatus rejects a missing status", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findOneMock = t.mock.method(Team, "findOne");

  const { res, getStatus } = createResponse();

  await updateTeamStatus(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      body: {},
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("updateTeamStatus rejects forming as an invalid requested status", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findOneMock = t.mock.method(Team, "findOne");

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      body: { status: "forming" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(
    getBody().message,
    '"status" must be one of [active, completed]'
  );
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("updateTeamStatus rejects invalid transitions from an active team", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "active" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: team._id.toString() },
      body: { status: "active" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "An active team can only be completed.");
  assert.equal(saved, false);
});

test("updateTeamStatus prevents changing a completed team", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "completed" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: team._id.toString() },
      body: { status: "active" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(saved, false);
  assert.ok(getBody());
});

test("updateTeamStatus prevents changing a disbanded team", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "disbanded" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: team._id.toString() },
      body: { status: "active" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(saved, false);
  assert.ok(getBody());
});

test("updateTeamStatus allows the owner to activate a forming team", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "forming" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);
  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: team._id.toString() },
      body: { status: "active" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(team.status, "active");
  assert.equal(saved, true);
  assert.equal(getBody().success, true);
});

test("updateTeamStatus allows the owner to complete a forming team", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "forming" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);
  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: team._id.toString() },
      body: { status: "completed" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(team.status, "completed");
  assert.equal(saved, true);
  assert.equal(getBody().success, true);
});

test("updateTeamStatus allows the owner to complete an active team", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "active" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);
  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: team._id.toString() },
      body: { status: "completed" },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(team.status, "completed");
  assert.equal(saved, true);
  assert.equal(getBody().message, "Team status updated successfully.");
});

test("updateTeamStatus returns 404 when the current user is not the owner", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;

  t.mock.method(Team, "findOne", async () => null);

  const { res, getStatus, getBody } = createResponse();

  await updateTeamStatus(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      body: { status: "active" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Team not found.");
});

test("updateTeamStatus forwards save errors to next", async (t) => {
  const { updateTeamStatus } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "forming" });
  const databaseError = new Error("Database save failed");
  let forwardedError;

  team.save = async () => {
    throw databaseError;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus } = createResponse();

  await updateTeamStatus(
    {
      params: { teamId: team._id.toString() },
      body: { status: "active" },
      user: { _id: team.owner },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

// -----------------------------------------------------------------------------
// disbandTeam
// -----------------------------------------------------------------------------

test("disbandTeam rejects an invalid team ID", async (t) => {
  const { disbandTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findOneMock = t.mock.method(Team, "findOne");

  const { res, getStatus, getBody } = createResponse();

  await disbandTeam(
    {
      params: { teamId: "invalid-id" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid team ID.");
  assert.equal(findOneMock.mock.callCount(), 0);
});

test("disbandTeam marks an owned team as disbanded", async (t) => {
  const { disbandTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);
  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await disbandTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(team.status, "disbanded");
  assert.equal(saved, true);
  assert.equal(getBody().message, "Team disbanded successfully.");
});

test("disbandTeam returns 404 when the current user is not the owner", async (t) => {
  const { disbandTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;

  t.mock.method(Team, "findOne", async () => null);

  const { res, getStatus, getBody } = createResponse();

  await disbandTeam(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Team not found.");
});

test("disbandTeam rejects an already disbanded team", async (t) => {
  const { disbandTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "disbanded" });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus, getBody } = createResponse();

  await disbandTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: team.owner },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Team is already disbanded.");
  assert.equal(saved, false);
});

test("disbandTeam forwards save errors to next", async (t) => {
  const { disbandTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  const databaseError = new Error("Save failed");
  let forwardedError;

  team.save = async () => {
    throw databaseError;
  };

  t.mock.method(Team, "findOne", async () => team);

  const { res, getStatus } = createResponse();

  await disbandTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: team.owner },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

// -----------------------------------------------------------------------------
// joinTeam
// -----------------------------------------------------------------------------

test("joinTeam rejects an invalid team ID", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findByIdMock = t.mock.method(Team, "findById");

  const { res, getStatus, getBody } = createResponse();

  await joinTeam(
    {
      params: { teamId: "invalid-id" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid team ID.");
  assert.equal(findByIdMock.mock.callCount(), 0);
});

test("joinTeam returns 404 when the team does not exist", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;

  t.mock.method(Team, "findById", () => createQuery(null));

  const { res, getStatus, getBody } = createResponse();

  await joinTeam(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Team not found.");
});

test("joinTeam adds a user as a member and saves the team", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  const userId = new mongoose.Types.ObjectId();
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await joinTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: userId },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(saved, true);
  assert.equal(team.members.length, 1);
  assert.equal(team.members[0].user, userId);
  assert.equal(team.members[0].role, "member");
  assert.equal(getBody().success, true);
});

test("joinTeam allows joining an active team", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "active" });
  const userId = new mongoose.Types.ObjectId();

  team.save = async () => {};

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus } = createResponse();

  await joinTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: userId },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(team.members.length, 1);
});

test("joinTeam rejects a user who is already a member", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const userId = new mongoose.Types.ObjectId();
  const team = makeTeam({
    members: [{ user: userId, role: "member" }],
  });

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await joinTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: userId },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 409);
  assert.equal(getBody().message, "You are already a member of this team.");
  assert.equal(team.members.length, 1);
});

test("joinTeam rejects joining a completed team", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "completed" });

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await joinTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(
    getBody().message,
    "You cannot join a completed or disbanded team."
  );
});

test("joinTeam rejects joining a disbanded team", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam({ status: "disbanded" });

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await joinTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(
    getBody().message,
    "You cannot join a completed or disbanded team."
  );
});

test("joinTeam forwards save errors to next", async (t) => {
  const { joinTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  const databaseError = new Error("Save failed");
  let forwardedError;

  team.save = async () => {
    throw databaseError;
  };

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus } = createResponse();

  await joinTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});

// -----------------------------------------------------------------------------
// leaveTeam
// -----------------------------------------------------------------------------

test("leaveTeam rejects an invalid team ID", async (t) => {
  const { leaveTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const findByIdMock = t.mock.method(Team, "findById");

  const { res, getStatus, getBody } = createResponse();

  await leaveTeam(
    {
      params: { teamId: "invalid-id" },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(getBody().message, "Invalid team ID.");
  assert.equal(findByIdMock.mock.callCount(), 0);
});

test("leaveTeam returns 404 when the team does not exist", async (t) => {
  const { leaveTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;

  t.mock.method(Team, "findById", () => createQuery(null));

  const { res, getStatus, getBody } = createResponse();

  await leaveTeam(
    {
      params: {
        teamId: new mongoose.Types.ObjectId().toString(),
      },
      user: { _id: new mongoose.Types.ObjectId() },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "Team not found.");
});

test("leaveTeam prevents the owner from leaving their own team", async (t) => {
  const { leaveTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const ownerId = new mongoose.Types.ObjectId();
  const team = makeTeam({
    owner: ownerId,
    members: [{ user: ownerId, role: "owner" }],
  });

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await leaveTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: ownerId },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 400);
  assert.equal(
    getBody().message,
    "The team owner cannot leave. Disband the team instead."
  );
  assert.equal(team.members.length, 1);
});

test("leaveTeam removes a regular member and saves the team", async (t) => {
  const { leaveTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const userId = new mongoose.Types.ObjectId();
  const team = makeTeam({
    members: [
      { user: new mongoose.Types.ObjectId(), role: "owner" },
      { user: userId, role: "member" },
    ],
  });
  let saved = false;

  team.save = async () => {
    saved = true;
  };

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await leaveTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: userId },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 200);
  assert.equal(saved, true);
  assert.equal(team.members.length, 1);
  assert.equal(
    team.members.some(
      (member) => member.user.toString() === userId.toString()
    ),
    false
  );
  assert.equal(getBody().success, true);
});

test("leaveTeam returns 404 when the user is not a member", async (t) => {
  const { leaveTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const team = makeTeam();
  const userId = new mongoose.Types.ObjectId();

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus, getBody } = createResponse();

  await leaveTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: userId },
    },
    res,
    (error) => assert.fail(error)
  );

  assert.equal(getStatus(), 404);
  assert.equal(getBody().message, "You are not a member of this team.");
});

test("leaveTeam forwards save errors to next", async (t) => {
  const { leaveTeam } = await import("../controllers/teamController.js");
  const Team = (await import("../models/Team.js")).default;
  const userId = new mongoose.Types.ObjectId();
  const team = makeTeam({
    members: [{ user: userId, role: "member" }],
  });
  const databaseError = new Error("Save failed");
  let forwardedError;

  team.save = async () => {
    throw databaseError;
  };

  t.mock.method(Team, "findById", () => createQuery(team));

  const { res, getStatus } = createResponse();

  await leaveTeam(
    {
      params: { teamId: team._id.toString() },
      user: { _id: userId },
    },
    res,
    (error) => {
      forwardedError = error;
    }
  );

  assert.equal(getStatus(), undefined);
  assert.equal(forwardedError, databaseError);
});
