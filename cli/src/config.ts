import { homedir } from "node:os";
import { join } from "node:path";
import { readCredentials } from "./credentials.js";

const DEFAULT_API_URL = "https://api.skillforge.mbadet.fr";

export function resolveApiUrl(flagValue?: string, credentialsBaseDir?: string): string {
  if (flagValue) return flagValue;
  if (process.env.SKILLFORGE_API_URL) return process.env.SKILLFORGE_API_URL;
  const stored = readCredentials(credentialsBaseDir);
  if (stored?.apiUrl) return stored.apiUrl;
  return DEFAULT_API_URL;
}

export function resolveTargetDir(flagValue?: string): string {
  if (flagValue) return flagValue;
  return join(homedir(), ".claude");
}
