import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveApiUrl, resolveTargetDir } from "../src/config.js";
import { writeCredentials } from "../src/credentials.js";

describe("resolveApiUrl", () => {
  let tempDir: string;
  const originalEnv = process.env.SKILLFORGE_API_URL;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "skillforge-config-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
    if (originalEnv === undefined) delete process.env.SKILLFORGE_API_URL;
    else process.env.SKILLFORGE_API_URL = originalEnv;
  });

  it("prefers the explicit flag over everything else", () => {
    process.env.SKILLFORGE_API_URL = "http://env.example.com";
    writeCredentials({ apiUrl: "http://stored.example.com", accessToken: "a", refreshToken: "b" }, tempDir);

    expect(resolveApiUrl("http://flag.example.com", tempDir)).toBe("http://flag.example.com");
  });

  it("falls back to the env var when no flag is given", () => {
    process.env.SKILLFORGE_API_URL = "http://env.example.com";
    writeCredentials({ apiUrl: "http://stored.example.com", accessToken: "a", refreshToken: "b" }, tempDir);

    expect(resolveApiUrl(undefined, tempDir)).toBe("http://env.example.com");
  });

  it("falls back to stored credentials when no flag or env var is set", () => {
    delete process.env.SKILLFORGE_API_URL;
    writeCredentials({ apiUrl: "http://stored.example.com", accessToken: "a", refreshToken: "b" }, tempDir);

    expect(resolveApiUrl(undefined, tempDir)).toBe("http://stored.example.com");
  });

  it("falls back to the default when nothing else is available", () => {
    delete process.env.SKILLFORGE_API_URL;

    expect(resolveApiUrl(undefined, tempDir)).toBe("https://api.skillforge.mbadet.fr");
  });
});

describe("resolveTargetDir", () => {
  it("uses the flag value when provided", () => {
    expect(resolveTargetDir("/custom/dir")).toBe("/custom/dir");
  });

  it("defaults to ~/.claude when no flag is given", () => {
    expect(resolveTargetDir(undefined)).toMatch(/\.claude$/);
  });
});
