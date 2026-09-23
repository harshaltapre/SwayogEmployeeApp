import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export interface ParsedReleaseTag {
  major: number;
  minor: number;
  patch: number;
  build: number;
  rawTag: string;
}

export interface CommitInfo {
  hash: string;
  subject: string;
  body: string;
}

export type BumpType = "major" | "minor" | "patch";

export interface VersionCalculationResult {
  previousTag: string;
  previousVersion: string;
  previousBuild: number;
  bumpType: BumpType;
  versionName: string;
  versionCode: number;
  releaseTag: string;
  releaseTitle: string;
  releaseNotes: string;
}

/**
 * Parses release tags matching the format: v<major>.<minor>.<patch>-build<build>
 * Example: v1.0.1-build22 -> { major: 1, minor: 0, patch: 1, build: 22 }
 */
export function parseReleaseTag(tag: string): ParsedReleaseTag | null {
  const match = tag.trim().match(/^v(\d+)\.(\d+)\.(\d+)-build(\d+)$/);
  if (!match) return null;
  return {
    major: parseInt(match[1], 10),
    minor: parseInt(match[2], 10),
    patch: parseInt(match[3], 10),
    build: parseInt(match[4], 10),
    rawTag: tag.trim(),
  };
}

/**
 * Finds the tag with the highest build number among all existing production tags.
 * Falls back to baseline (v1.0.0, build 20) if no production tags exist.
 */
export function findLatestRelease(tags: string[]): ParsedReleaseTag {
  const parsed = tags
    .map(parseReleaseTag)
    .filter((t): t is ParsedReleaseTag => t !== null);

  if (parsed.length === 0) {
    return {
      major: 1,
      minor: 0,
      patch: 0,
      build: 20,
      rawTag: "",
    };
  }

  // Sort by build number descending (highest build is latest production release)
  parsed.sort((a, b) => b.build - a.build);
  return parsed[0];
}

/**
 * Determines whether a commit indicates a breaking change, feature, or patch.
 */
export function classifyCommit(commit: { subject: string; body?: string }): BumpType {
  const subject = commit.subject.trim();
  const body = (commit.body || "").trim();

  // 1. Check for Breaking Changes:
  // e.g. "feat!: ...", "fix(api)!: ...", or body with "BREAKING CHANGE:" / "BREAKING-CHANGE:"
  const breakingHeaderRegex = /^[a-zA-Z]+(\([^\)]+\))?!:/;
  const breakingPatternInText = /\bBREAKING[- ]CHANGE:/i;

  if (breakingHeaderRegex.test(subject) || breakingPatternInText.test(subject) || breakingPatternInText.test(body)) {
    return "major";
  }

  // 2. Check for New Features:
  // e.g. "feat: ...", "feat(scope): ..."
  const featureHeaderRegex = /^feat(\([^\)]+\))?:/i;
  if (featureHeaderRegex.test(subject)) {
    return "minor";
  }

  // 3. All other commits (fix, perf, refactor, docs, chore, etc.) are patch-level
  return "patch";
}

/**
 * Evaluates a list of commits since the previous release and decides
 * the highest semantic version bump:
 * MAJOR (breaking) > MINOR (feature) > PATCH (fix/improvement)
 */
export function determineSemVerBump(commits: Array<{ subject: string; body?: string }>): BumpType {
  if (commits.length === 0) {
    return "patch";
  }

  let hasMinor = false;

  for (const commit of commits) {
    const classification = classifyCommit(commit);
    if (classification === "major") {
      return "major"; // Breaking change takes absolute precedence
    }
    if (classification === "minor") {
      hasMinor = true;
    }
  }

  if (hasMinor) {
    return "minor";
  }

  return "patch";
}

/**
 * Applies semantic versioning rules to calculate the next version name and version code.
 * Rules:
 * - major bump: major+1, minor=0, patch=0
 * - minor bump: major unchanged, minor+1, patch=0
 * - patch bump: major unchanged, minor unchanged, patch+1
 * - build/versionCode ALWAYS increases by 1 and is never reset.
 */
export function computeNextVersion(
  base: ParsedReleaseTag,
  bump: BumpType
): { versionName: string; versionCode: number; releaseTag: string; releaseTitle: string } {
  let nextMajor = base.major;
  let nextMinor = base.minor;
  let nextPatch = base.patch;

  if (bump === "major") {
    nextMajor += 1;
    nextMinor = 0;
    nextPatch = 0;
  } else if (bump === "minor") {
    nextMinor += 1;
    nextPatch = 0;
  } else {
    nextPatch += 1;
  }

  const nextVersionCode = base.build + 1;
  const nextVersionName = `${nextMajor}.${nextMinor}.${nextPatch}`;
  const releaseTag = `v${nextVersionName}-build${nextVersionCode}`;
  const releaseTitle = `Swayog Employee App v${nextVersionName} — Build ${nextVersionCode}`;

  return {
    versionName: nextVersionName,
    versionCode: nextVersionCode,
    releaseTag,
    releaseTitle,
  };
}

/**
 * Formats user-facing release notes grouped by type from commit history.
 */
export function generateGroupedReleaseNotes(
  commits: CommitInfo[],
  customNotes?: string
): string {
  const breaking: string[] = [];
  const features: string[] = [];
  const fixes: string[] = [];
  const improvements: string[] = [];

  for (const c of commits) {
    const classification = classifyCommit(c);
    const cleanSubject = c.subject.trim();

    if (classification === "major") {
      breaking.push(cleanSubject);
    } else if (classification === "minor") {
      features.push(cleanSubject);
    } else if (/^fix(\([^\)]+\))?:/i.test(cleanSubject)) {
      fixes.push(cleanSubject);
    } else {
      improvements.push(cleanSubject);
    }
  }

  const sections: string[] = [];

  if (customNotes && customNotes.trim().length > 0) {
    sections.push(customNotes.trim());
  }

  if (breaking.length > 0) {
    sections.push("### 💥 Breaking Changes\n" + breaking.map((s) => `- ${s}`).join("\n"));
  }
  if (features.length > 0) {
    sections.push("### 🚀 Features\n" + features.map((s) => `- ${s}`).join("\n"));
  }
  if (fixes.length > 0) {
    sections.push("### 🐛 Fixes\n" + fixes.map((s) => `- ${s}`).join("\n"));
  }
  if (improvements.length > 0) {
    sections.push("### ⚡ Improvements\n" + improvements.map((s) => `- ${s}`).join("\n"));
  }

  if (sections.length === 0) {
    return "### ⚡ Improvements\n- General performance improvements and bug fixes";
  }

  return sections.join("\n\n");
}

/**
 * Validates manual inputs provided during workflow_dispatch.
 */
export function validateManualInputs(
  versionName: string,
  versionCode: number,
  highestBuild: number,
  existingTags: string[]
): { valid: boolean; error?: string } {
  if (!/^\d+\.\d+\.\d+$/.test(versionName.trim())) {
    return {
      valid: false,
      error: `Invalid versionName "${versionName}". Must be a valid semantic version (e.g. 1.0.2).`,
    };
  }

  if (isNaN(versionCode) || versionCode <= 0) {
    return {
      valid: false,
      error: `Invalid versionCode "${versionCode}". Must be a positive integer.`,
    };
  }

  if (versionCode <= highestBuild) {
    return {
      valid: false,
      error: `versionCode ${versionCode} must be strictly greater than the highest existing production build (${highestBuild}).`,
    };
  }

  const targetTag = `v${versionName.trim()}-build${versionCode}`;
  if (existingTags.map((t) => t.trim()).includes(targetTag)) {
    return {
      valid: false,
      error: `Release tag ${targetTag} already exists! Production release tags are immutable.`,
    };
  }

  return { valid: true };
}

/**
 * Reads Git tags from repository.
 */
export function getGitTags(cwd: string = process.cwd()): string[] {
  try {
    const raw = execSync('git tag -l "v*-build*"', { cwd, encoding: "utf-8" });
    return raw
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean);
  } catch (err: any) {
    console.warn(`[Version] Could not query git tags: ${err.message}`);
    return [];
  }
}

/**
 * Reads Git commits between previous tag and HEAD.
 */
export function getCommitsSinceTag(tag: string, cwd: string = process.cwd()): CommitInfo[] {
  try {
    const range = tag ? `${tag}..HEAD` : "HEAD";
    // Format: Hash, Unit Separator (\x1f), Subject, Unit Separator (\x1f), Body, Record Separator (\x1e)
    const raw = execSync(`git log ${range} --format="%H%x1f%s%x1f%b%x1e"`, {
      cwd,
      encoding: "utf-8",
      maxBuffer: 10 * 1024 * 1024,
    });

    const entries = raw.split("\x1e").map((e) => e.trim()).filter(Boolean);
    const commits: CommitInfo[] = [];

    for (const entry of entries) {
      const parts = entry.split("\x1f");
      if (parts.length >= 2) {
        commits.push({
          hash: parts[0].trim(),
          subject: parts[1].trim(),
          body: (parts[2] || "").trim(),
        });
      }
    }

    return commits;
  } catch (err: any) {
    console.warn(`[Version] Could not query git log for range ${tag}..HEAD: ${err.message}`);
    return [];
  }
}

/**
 * Main execution for CI/CD workflow step.
 */
export function runVersionCalculation(opts: {
  repoDir?: string;
  manualVersionName?: string;
  manualVersionCodeStr?: string;
  manualReleaseNotes?: string;
  notesOutputPath?: string;
}): VersionCalculationResult {
  const repoDir = opts.repoDir || process.cwd();
  const tags = getGitTags(repoDir);
  const latestRelease = findLatestRelease(tags);

  const highestBuild = latestRelease.build;
  const previousTag = latestRelease.rawTag || `v${latestRelease.major}.${latestRelease.minor}.${latestRelease.patch}-build${latestRelease.build}`;
  const previousVersion = `${latestRelease.major}.${latestRelease.minor}.${latestRelease.patch}`;

  console.log(`[Version] Previous production release: ${previousTag} (Version: ${previousVersion}, Build: ${highestBuild})`);

  let bumpType: BumpType = "patch";
  let versionName = "";
  let versionCode = 0;
  let releaseTag = "";
  let releaseTitle = "";
  let releaseNotes = "";

  const commits = getCommitsSinceTag(latestRelease.rawTag, repoDir);
  console.log(`[Version] Commits since ${latestRelease.rawTag || "initial"}: ${commits.length}`);

  // Check if manual override was supplied via workflow_dispatch
  const hasManualName = !!(opts.manualVersionName && opts.manualVersionName.trim().length > 0);
  const hasManualCode = !!(opts.manualVersionCodeStr && opts.manualVersionCodeStr.trim().length > 0);

  if (hasManualName || hasManualCode) {
    const inputName = (opts.manualVersionName || "").trim();
    const inputCode = parseInt(opts.manualVersionCodeStr || "0", 10);

    const validation = validateManualInputs(inputName, inputCode, highestBuild, tags);
    if (!validation.valid) {
      throw new Error(`Manual version validation failed: ${validation.error}`);
    }

    versionName = inputName;
    versionCode = inputCode;
    releaseTag = `v${versionName}-build${versionCode}`;
    releaseTitle = `Swayog Employee App v${versionName} — Build ${versionCode}`;
    bumpType = "patch";
    releaseNotes = generateGroupedReleaseNotes(commits, opts.manualReleaseNotes);
    console.log(`[Version] Using validated manual override: ${releaseTag}`);
  } else {
    // Automatic SemVer calculation
    bumpType = determineSemVerBump(commits);
    const next = computeNextVersion(latestRelease, bumpType);
    versionName = next.versionName;
    versionCode = next.versionCode;
    releaseTag = next.releaseTag;
    releaseTitle = next.releaseTitle;
    releaseNotes = generateGroupedReleaseNotes(commits, opts.manualReleaseNotes);

    console.log(`[Version] Automatically calculated next version:`);
    console.log(`  - Semantic Bump:  ${bumpType.toUpperCase()}`);
    console.log(`  - Version Name:   ${versionName}`);
    console.log(`  - Version Code:   ${versionCode}`);
    console.log(`  - Release Tag:    ${releaseTag}`);
  }

  // Double check that calculated releaseTag does not already exist
  if (tags.includes(releaseTag)) {
    throw new Error(`Calculated release tag ${releaseTag} already exists! Production tags are immutable.`);
  }

  // Save release notes to output file if requested
  if (opts.notesOutputPath) {
    fs.writeFileSync(opts.notesOutputPath, releaseNotes, "utf-8");
    console.log(`[Version] Wrote release notes to: ${opts.notesOutputPath}`);
  }

  // Write outputs to GitHub Actions if running inside GitHub Actions
  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput && fs.existsSync(githubOutput)) {
    const outputs = [
      `VERSION_NAME=${versionName}`,
      `VERSION_CODE=${versionCode}`,
      `RELEASE_TAG=${releaseTag}`,
      `RELEASE_TITLE=${releaseTitle}`,
      `CHANGE_TYPE=${bumpType}`,
      `PREVIOUS_TAG=${previousTag}`,
      `PREVIOUS_VERSION=${previousVersion}`,
      `PREVIOUS_BUILD=${highestBuild}`,
    ];
    fs.appendFileSync(githubOutput, outputs.join("\n") + "\n", "utf-8");
    console.log(`[Version] Successfully wrote variables to GITHUB_OUTPUT`);
  }

  return {
    previousTag,
    previousVersion,
    previousBuild: highestBuild,
    bumpType,
    versionName,
    versionCode,
    releaseTag,
    releaseTitle,
    releaseNotes,
  };
}

// CLI entry point
const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(currentFile)) {
  const manualVersionName = process.env.INPUT_VERSION_NAME || process.argv[2] || "";
  const manualVersionCodeStr = process.env.INPUT_VERSION_CODE || process.argv[3] || "";
  const manualReleaseNotes = process.env.INPUT_RELEASE_NOTES || "";
  const notesOutputPath = process.argv[4] || path.resolve(process.cwd(), "release_notes.txt");

  try {
    const result = runVersionCalculation({
      manualVersionName,
      manualVersionCodeStr,
      manualReleaseNotes,
      notesOutputPath,
    });
    console.log("\n========================================");
    console.log(`🚀 Next Target Release: ${result.releaseTag}`);
    console.log(`Version:    ${result.versionName}`);
    console.log(`Build:      ${result.versionCode}`);
    console.log(`Change:     ${result.bumpType.toUpperCase()}`);
    console.log("========================================\n");
  } catch (err: any) {
    console.error(`::error::Version calculation error: ${err.message}`);
    process.exit(1);
  }
}
