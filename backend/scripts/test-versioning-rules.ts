import assert from "assert";
import {
  parseReleaseTag,
  findLatestRelease,
  classifyCommit,
  determineSemVerBump,
  computeNextVersion,
  generateGroupedReleaseNotes,
  validateManualInputs,
} from "./calculate-version.js";

console.log("========================================");
console.log("Running Semantic Versioning Unit Tests");
console.log("========================================\n");

// --- TEST 1: Current: v1.0.1-build22, Commit: fix: resolve attendance issue -> Expected: v1.0.2-build23
console.log("Executing TEST 1: Patch bump on fix commit...");
const base1 = parseReleaseTag("v1.0.1-build22");
assert.ok(base1 !== null, "base1 should parse");
assert.strictEqual(base1.major, 1);
assert.strictEqual(base1.minor, 0);
assert.strictEqual(base1.patch, 1);
assert.strictEqual(base1.build, 22);

const commits1 = [{ subject: "fix: resolve attendance issue" }];
const bump1 = determineSemVerBump(commits1);
assert.strictEqual(bump1, "patch", "Fix commit must trigger PATCH bump");

const next1 = computeNextVersion(base1, bump1);
assert.strictEqual(next1.versionName, "1.0.2", "VersionName must be 1.0.2");
assert.strictEqual(next1.versionCode, 23, "VersionCode must be 23");
assert.strictEqual(next1.releaseTag, "v1.0.2-build23", "ReleaseTag must be v1.0.2-build23");
console.log("✅ TEST 1 PASSED: v1.0.1-build22 -> v1.0.2-build23\n");

// --- TEST 2: Current: v1.0.2-build23, Commit: feat: improve attendance verification -> Expected: v1.1.0-build24
console.log("Executing TEST 2: Minor bump on feat commit...");
const base2 = parseReleaseTag("v1.0.2-build23");
assert.ok(base2 !== null, "base2 should parse");
assert.strictEqual(base2.build, 23);

const commits2 = [{ subject: "feat: improve attendance verification" }];
const bump2 = determineSemVerBump(commits2);
assert.strictEqual(bump2, "minor", "Feat commit must trigger MINOR bump");

const next2 = computeNextVersion(base2, bump2);
assert.strictEqual(next2.versionName, "1.1.0", "VersionName must be 1.1.0");
assert.strictEqual(next2.versionCode, 24, "VersionCode must be 24");
assert.strictEqual(next2.releaseTag, "v1.1.0-build24", "ReleaseTag must be v1.1.0-build24");
console.log("✅ TEST 2 PASSED: v1.0.2-build23 -> v1.1.0-build24\n");

// --- TEST 3: Current: v1.1.0-build24, Commit: fix: correct calendar synchronization -> Expected: v1.1.1-build25
console.log("Executing TEST 3: Patch bump after feature release...");
const base3 = parseReleaseTag("v1.1.0-build24");
assert.ok(base3 !== null, "base3 should parse");
assert.strictEqual(base3.build, 24);

const commits3 = [{ subject: "fix: correct calendar synchronization" }];
const bump3 = determineSemVerBump(commits3);
assert.strictEqual(bump3, "patch", "Fix commit must trigger PATCH bump");

const next3 = computeNextVersion(base3, bump3);
assert.strictEqual(next3.versionName, "1.1.1", "VersionName must be 1.1.1");
assert.strictEqual(next3.versionCode, 25, "VersionCode must be 25");
assert.strictEqual(next3.releaseTag, "v1.1.1-build25", "ReleaseTag must be v1.1.1-build25");
console.log("✅ TEST 3 PASSED: v1.1.0-build24 -> v1.1.1-build25\n");

// --- TEST 4: Current: v1.1.1-build25, Commit: feat!: replace authentication architecture -> Expected: v2.0.0-build26
console.log("Executing TEST 4: Major bump on breaking change commit...");
const base4 = parseReleaseTag("v1.1.1-build25");
assert.ok(base4 !== null, "base4 should parse");
assert.strictEqual(base4.build, 25);

const commits4A = [{ subject: "feat!: replace authentication architecture" }];
const bump4A = determineSemVerBump(commits4A);
assert.strictEqual(bump4A, "major", "feat! must trigger MAJOR bump");

const next4A = computeNextVersion(base4, bump4A);
assert.strictEqual(next4A.versionName, "2.0.0", "VersionName must be 2.0.0");
assert.strictEqual(next4A.versionCode, 26, "VersionCode must be 26");
assert.strictEqual(next4A.releaseTag, "v2.0.0-build26", "ReleaseTag must be v2.0.0-build26");

// Also test BREAKING CHANGE in body
const commits4B = [{
  subject: "refactor(auth): modernize session management",
  body: "BREAKING CHANGE: refresh token format updated to v2",
}];
const bump4B = determineSemVerBump(commits4B);
assert.strictEqual(bump4B, "major", "BREAKING CHANGE in body must trigger MAJOR bump");
const next4B = computeNextVersion(base4, bump4B);
assert.strictEqual(next4B.versionName, "2.0.0", "VersionName must be 2.0.0");
assert.strictEqual(next4B.versionCode, 26, "VersionCode must be 26");
console.log("✅ TEST 4 PASSED: v1.1.1-build25 -> v2.0.0-build26\n");

// --- TEST 5: Multiple commit priority: BREAKING > FEATURE > PATCH
console.log("Executing TEST 5: Multiple commit priority evaluation...");
const multiCommits1 = [
  { subject: "fix: update button color" },
  { subject: "feat: add dark mode" },
  { subject: "chore: update dependencies" },
];
assert.strictEqual(determineSemVerBump(multiCommits1), "minor", "feat should override fix/chore");

const multiCommits2 = [
  { subject: "fix: update button color" },
  { subject: "feat: add dark mode" },
  { subject: "refactor!: rewrite API layer" },
];
assert.strictEqual(determineSemVerBump(multiCommits2), "major", "breaking change should override feat and fix");
console.log("✅ TEST 5 PASSED: Priority hierarchy strictly respected\n");

// --- TEST 6: Highest build resolution from tag list
console.log("Executing TEST 6: Finding latest release from tag list...");
const existingTags = [
  "v1.0.0-build20",
  "v1.0.1-build21",
  "v1.0.1-build22",
  "unrelated-tag-1.0",
];
const latest = findLatestRelease(existingTags);
assert.strictEqual(latest.build, 22, "Latest build must be 22");
assert.strictEqual(latest.major, 1);
assert.strictEqual(latest.minor, 0);
assert.strictEqual(latest.patch, 1);
assert.strictEqual(latest.rawTag, "v1.0.1-build22");
console.log("✅ TEST 6 PASSED: Correctly identified v1.0.1-build22 as latest\n");

// --- TEST 7: Manual input validation
console.log("Executing TEST 7: Manual override validation...");
// Invalid SemVer string
assert.strictEqual(validateManualInputs("1.0", 23, 22, existingTags).valid, false);
// Reusing existing build number (<= 22)
assert.strictEqual(validateManualInputs("1.0.2", 22, 22, existingTags).valid, false);
// Overwriting existing tag
assert.strictEqual(validateManualInputs("1.0.1", 22, 21, existingTags).valid, false);
// Valid manual override
assert.strictEqual(validateManualInputs("1.0.2", 23, 22, existingTags).valid, true);
console.log("✅ TEST 7 PASSED: Manual input validation strictly enforces SemVer, monotonicity, and tag immutability\n");

console.log("========================================");
console.log("🎉 ALL SEMANTIC VERSIONING TESTS PASSED");
console.log("========================================\n");
