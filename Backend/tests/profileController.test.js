
import test, { afterEach, beforeEach } from "node:test";
import assert from "node:assert/strict";
import mongoose from "mongoose";
import Profile from "../models/Profile.js";
import Application from "../models/Application.js";
import Review from "../models/Review.js";

const originalReviewAggregate = Review.aggregate;
const originalApplicationAggregate = Application.aggregate;
beforeEach(() => {
  Review.aggregate = async () => [];
  Application.aggregate = async () => [];
});
afterEach(() => {
  Review.aggregate = originalReviewAggregate;
  Application.aggregate = originalApplicationAggregate;
});

import {
  getMyProfile,
  createOrUpdateMyProfile,
} from "../controllers/profileController.js";

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

test("getMyProfile returns the current user's profile", async (t) => {
  const userId = new mongoose.Types.ObjectId();
  const profileId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOne", async () => ({
    _id: profileId,
    user: userId,
    headline: "Full Stack Developer",
    __v: 0,
  }));

  const req = { user: { _id: userId } };
  const { res, getStatus, getBody } = createResponse();

  await getMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.profile.id, String(profileId));
  assert.equal(getBody().data.profile.user, String(userId));
  assert.equal(getBody().data.profile.headline, "Full Stack Developer");
  assert.equal("__v" in getBody().data.profile, false);
});

test("getMyProfile returns null when the user has no profile", async (t) => {
  t.mock.method(Profile, "findOne", async () => null);

  const req = { user: { _id: new mongoose.Types.ObjectId() } };
  const { res, getStatus, getBody } = createResponse();

  await getMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.profile, null);
});

test("getMyProfile forwards database errors to next", async (t) => {
  const databaseError = new Error("Database unavailable");

  t.mock.method(Profile, "findOne", async () => {
    throw databaseError;
  });

  const req = { user: { _id: new mongoose.Types.ObjectId() } };
  const { res } = createResponse();
  let nextError;

  await getMyProfile(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, databaseError);
});

test("getMyProfile formats a plain profile object without toObject", async (t) => {
  const profileId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOne", async () => ({
    _id: profileId,
    user: null,
    headline: "Plain JavaScript profile",
    __v: 2,
  }));

  const req = { user: { _id: new mongoose.Types.ObjectId() } };
  const { res, getStatus, getBody } = createResponse();

  await getMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().data.profile.id, String(profileId));
  assert.equal(getBody().data.profile.user, null);
  assert.equal(
    getBody().data.profile.headline,
    "Plain JavaScript profile"
  );
  assert.equal("__v" in getBody().data.profile, false);
});

test("student can update allowed profile fields without changing restricted fields", async (t) => {
  const userId = new mongoose.Types.ObjectId();
  const profileId = new mongoose.Types.ObjectId();

  const updatedProfile = {
    _id: profileId,
    user: userId,
    headline: "MERN Developer",
    skillsOffered: ["React", "Node.js"],
  };

  const findOneAndUpdate = t.mock.method(
    Profile,
    "findOneAndUpdate",
    async () => updatedProfile
  );

  const req = {
    user: { _id: userId, role: "student" },
    body: {
      headline: "MERN Developer",
      skillsOffered: ["React", "Node.js"],
      businessName: "Unauthorized Business",
      role: "admin",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await createOrUpdateMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.profile.headline, "MERN Developer");

  const [filter, update, options] =
    findOneAndUpdate.mock.calls[0].arguments;

  assert.deepEqual(filter, { user: userId });
  assert.deepEqual(update.$set, {
    headline: "MERN Developer",
    skillsOffered: ["React", "Node.js"],
  });
  assert.deepEqual(update.$setOnInsert, { user: userId });
  assert.equal(options.upsert, true);
  assert.equal(options.runValidators, true);
});

test("student profile update accepts an explicitly supplied empty field value", async (t) => {
  const userId = new mongoose.Types.ObjectId();

  const findOneAndUpdate = t.mock.method(
    Profile,
    "findOneAndUpdate",
    async () => ({
      _id: new mongoose.Types.ObjectId(),
      user: userId,
      headline: "",
    })
  );

  const req = {
    user: { _id: userId, role: "student" },
    body: { headline: "" },
  };

  const { res, getStatus, getBody } = createResponse();

  await createOrUpdateMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  test("profile title and wanted skills survive save and reload", async (t) => {
    const userId = new mongoose.Types.ObjectId();
    const profileId = new mongoose.Types.ObjectId();
    const savedFields = {
      _id: profileId,
      user: userId,
      headline: "Frontend developer",
      skillsWanted: ["Accessibility"],
    };

    t.mock.method(Profile, "findOneAndUpdate", async (_filter, update) => ({
      ...savedFields,
      ...update.$set,
    }));
    t.mock.method(Profile, "findOne", async () => savedFields);
    t.mock.method(Review, "aggregate", async () => []);
    t.mock.method(Application, "aggregate", async () => []);

    const updateResponse = createResponse();
    await createOrUpdateMyProfile(
      {
        user: { _id: userId, role: "student" },
        body: { title: "Frontend developer", wantedSkills: ["Accessibility"] },
      },
      updateResponse.res,
      (error) => assert.fail(`Unexpected error: ${error}`)
    );

    assert.equal(updateResponse.getStatus(), 200);
    assert.equal(updateResponse.getBody().data.profile.title, "Frontend developer");
    assert.deepEqual(updateResponse.getBody().data.profile.wantedSkills, ["Accessibility"]);

    const reloadResponse = createResponse();
    await getMyProfile(
      { user: { _id: userId } },
      reloadResponse.res,
      (error) => assert.fail(`Unexpected error: ${error}`)
    );

    assert.equal(reloadResponse.getStatus(), 200);
    assert.equal(reloadResponse.getBody().data.profile.title, "Frontend developer");
    assert.deepEqual(reloadResponse.getBody().data.profile.wantedSkills, ["Accessibility"]);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().data.profile.headline, "");

  const update = findOneAndUpdate.mock.calls[0].arguments[1];
  assert.deepEqual(update.$set, { headline: "" });
});

test("client can update business profile fields", async (t) => {
  const userId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOneAndUpdate", async () => ({
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    businessName: "Example Business",
    industry: "Technology",
  }));

  const req = {
    user: { _id: userId, role: "client" },
    body: {
      businessName: "Example Business",
      industry: "Technology",
      skillsOffered: ["React"],
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await createOrUpdateMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.profile.businessName, "Example Business");

  const update = Profile.findOneAndUpdate.mock.calls[0].arguments[1];

  assert.deepEqual(update.$set, {
    businessName: "Example Business",
    industry: "Technology",
  });
});

test("admin cannot create or update a profile through this controller", async (t) => {
  const findOneAndUpdate = t.mock.method(Profile, "findOneAndUpdate");

  const req = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      role: "admin",
    },
    body: { headline: "Admin profile" },
  };

  const { res, getStatus, getBody } = createResponse();

  await createOrUpdateMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 403);
  assert.equal(getBody().success, false);
  assert.equal(findOneAndUpdate.mock.callCount(), 0);
});

test("profile update rejects a body with no allowed fields", async (t) => {
  const findOneAndUpdate = t.mock.method(Profile, "findOneAndUpdate");

  const req = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      role: "student",
    },
    body: {
      businessName: "Not allowed for students",
      role: "admin",
    },
  };

  const { res, getStatus, getBody } = createResponse();

  await createOrUpdateMyProfile(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 400);
  assert.equal(getBody().success, false);
  assert.equal(findOneAndUpdate.mock.callCount(), 0);
});

test("profile update forwards database errors to next", async (t) => {
  const databaseError = new Error("Database unavailable");

  t.mock.method(Profile, "findOneAndUpdate", async () => {
    throw databaseError;
  });

  const req = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      role: "student",
    },
    body: { headline: "Updated headline" },
  };

  const { res } = createResponse();
  let nextError;

  await createOrUpdateMyProfile(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, databaseError);
});

test("client profile update forwards database errors to next", async (t) => {
  const databaseError = new Error("Client profile write failed");

  t.mock.method(Profile, "findOneAndUpdate", async () => {
    throw databaseError;
  });

  const req = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      role: "client",
    },
    body: { businessName: "Example Business" },
  };

  const { res } = createResponse();
  let nextError;

  await createOrUpdateMyProfile(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, databaseError);
});

test("student profile fields survive save and reload", async (t) => {
  let saved;
  const userId = new mongoose.Types.ObjectId();
  const body = {
    title: "Product engineer", university: "State University", course: "Computer Science",
    year: "Third year", experience: "Built two student apps", availability: "Weekends",
    skills: [{ name: "React", level: "advanced", proficiency: 88 }],
    wantedSkills: ["Rust"], certifications: [{ name: "Cloud Basics", issuer: "Example", year: 2025 }],
    portfolio: [{ title: "Campus Map", url: "https://example.test/map", description: "A student map", skills: ["React"] }],
    socialLinks: [{ label: "GitHub", url: "https://github.com/example" }, { label: "LinkedIn", url: "https://linkedin.com/in/example" }],
  };
  t.mock.method(Profile, "findOneAndUpdate", async (_filter, update) => {
    saved = { _id: new mongoose.Types.ObjectId(), user: userId, ...update.$set };
    return saved;
  });
  t.mock.method(Profile, "findOne", async () => saved);

  const update = createResponse();
  await createOrUpdateMyProfile({ user: { _id: userId, role: "student" }, body }, update.res, (error) => assert.fail(error));
  const reload = createResponse();
  await getMyProfile({ user: { _id: userId } }, reload.res, (error) => assert.fail(error));

  const profile = reload.getBody().data.profile;
  for (const field of ["title", "university", "course", "year", "experience", "availability", "skills", "wantedSkills", "certifications", "portfolio", "socialLinks"]) {
    assert.deepEqual(profile[field], body[field], `${field} should persist across reload`);
  }
  assert.deepEqual(profile.skillsOffered, ["React"]);
  assert.deepEqual(profile.skillsWanted, ["Rust"]);
});

test("client contact and business fields survive save and reload", async (t) => {
  let saved;
  const userId = new mongoose.Types.ObjectId();
  const body = {
    businessName: "Campus Labs", contactName: "Taylor", contactEmail: "taylor@example.test",
    contactPhone: "+1 555 0134", industry: "Education", companySize: "11-50",
    website: "https://campus.example.test", description: "Tools for student teams",
  };
  t.mock.method(Profile, "findOneAndUpdate", async (_filter, update) => {
    saved = { _id: new mongoose.Types.ObjectId(), user: userId, ...update.$set };
    return saved;
  });
  t.mock.method(Profile, "findOne", async () => saved);

  const update = createResponse();
  await createOrUpdateMyProfile({ user: { _id: userId, role: "client" }, body }, update.res, (error) => assert.fail(error));
  const reload = createResponse();
  await getMyProfile({ user: { _id: userId } }, reload.res, (error) => assert.fail(error));
  const profile = reload.getBody().data.profile;
  for (const field of Object.keys(body)) assert.deepEqual(profile[field], body[field], `${field} should persist across reload`);
  assert.equal(profile.businessDescription, body.description);
});

test("discoverPartners returns mutual skill matches with pagination metadata", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");
  const User = (await import("../models/User.js")).default;

  const currentUserId = new mongoose.Types.ObjectId();
  const partnerUserId = new mongoose.Types.ObjectId();
  const otherUserId = new mongoose.Types.ObjectId();

  const currentProfile = {
    user: currentUserId,
    skillsOffered: ["React"],
    skillsWanted: ["Python"],
  };

  const candidateUsers = [
    {
      _id: partnerUserId,
      name: "Alex",
      avatar: "",
      role: "student",
    },
    {
      _id: otherUserId,
      name: "Jordan",
      avatar: "",
      role: "student",
    },
  ];

  const candidateProfiles = [
    {
      user: partnerUserId,
      headline: "Python Developer",
      location: "Bengaluru",
      skillsOffered: ["python"],
      skillsWanted: [" react "],
      interests: ["AI"],
    },
    {
      user: otherUserId,
      headline: "Designer",
      location: "Pune",
      skillsOffered: ["Design"],
      skillsWanted: ["Photography"],
      interests: [],
    },
  ];

  t.mock.method(Profile, "findOne", async () => currentProfile);

  t.mock.method(User, "find", () => ({
    select() {
      return {
        lean: async () => candidateUsers,
      };
    },
  }));

  t.mock.method(Profile, "find", () => ({
    lean: async () => candidateProfiles,
  }));

  const req = {
    user: { _id: currentUserId, role: "student" },
    partnerQuery: { page: 1, limit: 12, search: "" },
  };

  const { res, getStatus, getBody } = createResponse();

  await discoverPartners(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().success, true);
  assert.equal(getBody().data.partners.length, 2);

  const matchedPartner = getBody().data.partners[0];

  assert.equal(matchedPartner.id, String(partnerUserId));
  assert.equal(matchedPartner.name, "Alex");
  assert.equal(matchedPartner.matchPercent, 100);

  assert.deepEqual(getBody().meta, {
    page: 1,
    limit: 12,
    total: 2,
    totalPages: 1,
  });
});

test("discoverPartners returns null match percentages when neither profile has exchange skills", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");
  const User = (await import("../models/User.js")).default;

  const currentUserId = new mongoose.Types.ObjectId();
  const partnerUserId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOne", async () => ({
    skillsOffered: [],
    skillsWanted: [],
  }));

  t.mock.method(User, "find", () => ({
    select() {
      return {
        lean: async () => [
          {
            _id: partnerUserId,
            name: "Alex",
            avatar: "",
            role: "student",
          },
        ],
      };
    },
  }));

  t.mock.method(Profile, "find", () => ({
    lean: async () => [
      {
        user: partnerUserId,
        headline: "Developer",
      },
    ],
  }));

  const req = {
    user: { _id: currentUserId, role: "student" },
    partnerQuery: { page: 1, limit: 12, search: "" },
  };

  const { res, getStatus, getBody } = createResponse();

  await discoverPartners(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().data.partners.length, 1);
  assert.equal(getBody().data.partners[0].matchPercent, null);
  assert.deepEqual(getBody().data.partners[0].skillsOffered, []);
  assert.deepEqual(getBody().data.partners[0].skillsWanted, []);
  assert.deepEqual(getBody().data.partners[0].interests, []);
});

test("discoverPartners returns zero match when skills do not overlap", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");
  const User = (await import("../models/User.js")).default;

  const currentUserId = new mongoose.Types.ObjectId();
  const partnerUserId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOne", async () => ({
    skillsOffered: ["React"],
    skillsWanted: ["Python"],
  }));

  t.mock.method(User, "find", () => ({
    select() {
      return {
        lean: async () => [
          {
            _id: partnerUserId,
            name: "Alex",
            avatar: "",
            role: "student",
          },
        ],
      };
    },
  }));

  t.mock.method(Profile, "find", () => ({
    lean: async () => [
      {
        user: partnerUserId,
        headline: "Designer",
        skillsOffered: ["Design"],
        skillsWanted: ["Photography"],
      },
    ],
  }));

  const req = {
    user: { _id: currentUserId, role: "student" },
    partnerQuery: { page: 1, limit: 12, search: "" },
  };

  const { res, getStatus, getBody } = createResponse();

  await discoverPartners(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().data.partners.length, 1);
  assert.equal(getBody().data.partners[0].matchPercent, 0);
});

test("discoverPartners rejects non-student users without querying the database", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");

  const findOne = t.mock.method(Profile, "findOne");
  const find = t.mock.method(Profile, "find");

  const req = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      role: "client",
    },
    partnerQuery: { page: 1, limit: 12, search: "" },
  };

  const { res, getStatus, getBody } = createResponse();

  await discoverPartners(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 403);
  assert.equal(getBody().success, false);
  assert.equal(findOne.mock.callCount(), 0);
  assert.equal(find.mock.callCount(), 0);
});

test("discoverPartners forwards database errors to next", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");

  const databaseError = new Error("Database unavailable");

  t.mock.method(Profile, "findOne", async () => {
    throw databaseError;
  });

  const req = {
    user: {
      _id: new mongoose.Types.ObjectId(),
      role: "student",
    },
    partnerQuery: { page: 1, limit: 12, search: "" },
  };

  const { res } = createResponse();
  let nextError;

  await discoverPartners(req, res, (error) => {
    nextError = error;
  });

  assert.equal(nextError, databaseError);
});

test("discoverPartners filters results by search text", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");
  const User = (await import("../models/User.js")).default;

  const currentUserId = new mongoose.Types.ObjectId();
  const matchingId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOne", async () => ({
    skillsOffered: [],
    skillsWanted: [],
  }));

  t.mock.method(User, "find", () => ({
    select() {
      return {
        lean: async () => [
          { _id: matchingId, name: "Alex", avatar: "", role: "student" },
          { _id: otherId, name: "Jordan", avatar: "", role: "student" },
        ],
      };
    },
  }));

  t.mock.method(Profile, "find", () => ({
    lean: async () => [
      {
        user: matchingId,
        headline: "Python Developer",
        location: "Bengaluru",
        skillsOffered: ["Python"],
        skillsWanted: [],
      },
      {
        user: otherId,
        headline: "Designer",
        location: "Pune",
        skillsOffered: ["Design"],
        skillsWanted: [],
      },
    ],
  }));

  const req = {
    user: { _id: currentUserId, role: "student" },
    partnerQuery: { page: 1, limit: 12, search: "bengaluru" },
  };

  const { res, getStatus, getBody } = createResponse();

  await discoverPartners(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().data.partners.length, 1);
  assert.equal(getBody().data.partners[0].id, String(matchingId));
  assert.equal(getBody().meta.total, 1);
});

test("discoverPartners filters results by skill without case sensitivity", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");
  const User = (await import("../models/User.js")).default;

  const currentUserId = new mongoose.Types.ObjectId();
  const matchingId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOne", async () => ({
    skillsOffered: [],
    skillsWanted: [],
  }));

  t.mock.method(User, "find", () => ({
    select() {
      return {
        lean: async () => [
          { _id: matchingId, name: "Alex", avatar: "", role: "student" },
          { _id: otherId, name: "Jordan", avatar: "", role: "student" },
        ],
      };
    },
  }));

  t.mock.method(Profile, "find", () => ({
    lean: async () => [
      {
        user: matchingId,
        headline: "Developer",
        skillsOffered: ["Python"],
        skillsWanted: [],
      },
      {
        user: otherId,
        headline: "Designer",
        skillsOffered: ["Design"],
        skillsWanted: [],
      },
    ],
  }));

  const req = {
    user: { _id: currentUserId, role: "student" },
    partnerQuery: { page: 1, limit: 12, search: "", skill: "PYTHON" },
  };

  const { res, getStatus, getBody } = createResponse();

  await discoverPartners(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().data.partners.length, 1);
  assert.equal(getBody().data.partners[0].id, String(matchingId));
});

test("discoverPartners filters by experience, interest, availability, and project requirements", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");
  const User = (await import("../models/User.js")).default;
  const currentId = new mongoose.Types.ObjectId();
  const matchId = new mongoose.Types.ObjectId();
  const otherId = new mongoose.Types.ObjectId();
  t.mock.method(Profile, "findOne", async () => ({ skills: [], skillsWanted: [] }));
  t.mock.method(User, "find", () => ({ select() { return { lean: async () => [
    { _id: matchId, name: "Alex", avatar: "" }, { _id: otherId, name: "Jordan", avatar: "" },
  ] }; } }));
  t.mock.method(Profile, "find", () => ({ lean: async () => [
    { user: matchId, experience: "React production apps", availability: "Weekends", interests: ["Accessibility"], skills: [{ name: "React" }] },
    { user: otherId, experience: "React production apps", availability: "Weekdays", interests: ["Accessibility"], skills: [{ name: "React" }] },
  ] }));

  const { res, getBody } = createResponse();
  await discoverPartners({
    user: { _id: currentId, role: "student" },
    partnerQuery: { page: 1, limit: 10, search: "", experience: "production", interest: "accessibility", availability: "weekends", requirements: "React, Accessibility" },
  }, res, (error) => assert.fail(error));
  assert.equal(getBody().data.partners.length, 1);
  assert.equal(getBody().data.partners[0].id, String(matchId));
});

test("discoverPartners applies pagination and excludes profiles without matching users", async (t) => {
  const { discoverPartners } = await import("../controllers/profileController.js");
  const User = (await import("../models/User.js")).default;

  const currentUserId = new mongoose.Types.ObjectId();
  const firstId = new mongoose.Types.ObjectId();
  const secondId = new mongoose.Types.ObjectId();
  const unmatchedId = new mongoose.Types.ObjectId();

  t.mock.method(Profile, "findOne", async () => ({
    skillsOffered: [],
    skillsWanted: [],
  }));

  t.mock.method(User, "find", () => ({
    select() {
      return {
        lean: async () => [
          { _id: firstId, name: "First", avatar: "", role: "student" },
          { _id: secondId, name: "Second", avatar: "", role: "student" },
        ],
      };
    },
  }));

  t.mock.method(Profile, "find", () => ({
    lean: async () => [
      { user: firstId, headline: "Developer", skillsOffered: [], skillsWanted: [] },
      { user: secondId, headline: "Designer", skillsOffered: [], skillsWanted: [] },
      { user: unmatchedId, headline: "Unknown", skillsOffered: [], skillsWanted: [] },
    ],
  }));

  const req = {
    user: { _id: currentUserId, role: "student" },
    partnerQuery: { page: 2, limit: 1, search: "" },
  };

  const { res, getStatus, getBody } = createResponse();

  await discoverPartners(req, res, (error) => {
    assert.fail(`Unexpected error: ${error}`);
  });

  assert.equal(getStatus(), 200);
  assert.equal(getBody().data.partners.length, 1);
  assert.equal(getBody().data.partners[0].id, String(secondId));
  assert.deepEqual(getBody().meta, {
    page: 2,
    limit: 1,
    total: 2,
    totalPages: 2,
  });
});
