import test from "node:test";
import assert from "node:assert/strict";
import { authenticatedDownloadUrl, signCloudinaryParams, validCloudinaryAsset } from "../utils/cloudinary.js";

test("Cloudinary signatures are stable and order independent", () => {
  const a = signCloudinaryParams({ timestamp: 123, public_id: "campusxchange/test" }, "secret");
  const b = signCloudinaryParams({ public_id: "campusxchange/test", timestamp: 123 }, "secret");
  assert.equal(a, b);
  assert.match(a, /^[a-f0-9]{40}$/);
});

test("uploaded assets require a Cloudinary HTTPS URL and the caller folder", () => {
  assert.equal(validCloudinaryAsset("https://res.cloudinary.com/demo/image/upload/id", "campusxchange/avatars/user/id", "campusxchange/avatars/user"), true);
  assert.equal(validCloudinaryAsset("http://res.cloudinary.com/demo/image/upload/id", "campusxchange/avatars/user/id", "campusxchange/avatars/user"), false);
  assert.equal(validCloudinaryAsset("https://evil.example/id", "campusxchange/avatars/user/id", "campusxchange/avatars/user"), false);
  assert.equal(validCloudinaryAsset("https://res.cloudinary.com/demo/id", "campusxchange/avatars/other/id", "campusxchange/avatars/user"), false);
});

test("verification download URLs are signed, authenticated, and short-lived", () => {
  const url = new URL(authenticatedDownloadUrl({ cloudName: "demo", apiKey: "key", apiSecret: "secret", publicId: "campusxchange/verifications/u/file", format: "pdf", resourceType: "raw" }));
  assert.equal(url.hostname, "api.cloudinary.com");
  assert.equal(url.pathname, "/v1_1/demo/raw/download");
  assert.equal(url.searchParams.get("type"), "authenticated");
  assert.equal(url.searchParams.get("attachment"), "true");
  assert.match(url.searchParams.get("signature"), /^[a-f0-9]{40}$/);
  assert.ok(Number(url.searchParams.get("expires_at")) - Number(url.searchParams.get("timestamp")) <= 300);
  assert.equal(url.searchParams.get("api_secret"), null);
});
