import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { clearCredentials, readCredentials, writeCredentials } from "../src/credentials.js";

describe("credentials", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "skillforge-credentials-test-"));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it("returns null when no credentials file exists", () => {
    expect(readCredentials(tempDir)).toBeNull();
  });

  it("round-trips written credentials", () => {
    const creds = { apiUrl: "http://localhost:5080", accessToken: "access", refreshToken: "refresh" };
    writeCredentials(creds, tempDir);

    expect(readCredentials(tempDir)).toEqual(creds);
  });

  it("overwrites previous credentials on a second write", () => {
    writeCredentials({ apiUrl: "http://a", accessToken: "1", refreshToken: "2" }, tempDir);
    writeCredentials({ apiUrl: "http://b", accessToken: "3", refreshToken: "4" }, tempDir);

    expect(readCredentials(tempDir)).toEqual({ apiUrl: "http://b", accessToken: "3", refreshToken: "4" });
  });

  it("removes credentials on clear", () => {
    writeCredentials({ apiUrl: "http://a", accessToken: "1", refreshToken: "2" }, tempDir);
    clearCredentials(tempDir);

    expect(readCredentials(tempDir)).toBeNull();
  });

  it("clear is a no-op when nothing is stored", () => {
    expect(() => clearCredentials(tempDir)).not.toThrow();
  });
});
