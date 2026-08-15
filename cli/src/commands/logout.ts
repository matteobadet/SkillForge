import { clearCredentials } from "../credentials.js";

export function logoutCommand(): void {
  clearCredentials();
  console.log("Déconnecté.");
}
