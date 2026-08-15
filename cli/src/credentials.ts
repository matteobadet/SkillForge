import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

export interface Credentials {
  apiUrl: string;
  accessToken: string;
  refreshToken: string;
}

function credentialsDir(baseDir: string = homedir()): string {
  return join(baseDir, ".skillforge");
}

function credentialsPath(baseDir: string = homedir()): string {
  return join(credentialsDir(baseDir), "credentials.json");
}

export function readCredentials(baseDir: string = homedir()): Credentials | null {
  const path = credentialsPath(baseDir);
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, "utf-8")) as Credentials;
  } catch {
    return null;
  }
}

export function writeCredentials(credentials: Credentials, baseDir: string = homedir()): void {
  const dir = credentialsDir(baseDir);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  writeFileSync(credentialsPath(baseDir), JSON.stringify(credentials, null, 2), { mode: 0o600 });
}

export function clearCredentials(baseDir: string = homedir()): void {
  const path = credentialsPath(baseDir);
  if (existsSync(path)) {
    rmSync(path);
  }
}
