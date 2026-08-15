import prompts from "prompts";
import { writeCredentials } from "../credentials.js";
import { CliError } from "../apiClient.js";

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: { pseudo: string };
}

export async function loginCommand(apiUrl: string): Promise<void> {
  const answers = await prompts([
    { type: "text", name: "email", message: "Email" },
    { type: "password", name: "password", message: "Mot de passe" },
  ]);

  if (!answers.email || !answers.password) {
    throw new CliError("Connexion annulée.");
  }

  const res = await fetch(`${apiUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: answers.email, password: answers.password }),
  });

  if (!res.ok) {
    throw new CliError("Email ou mot de passe incorrect.");
  }

  const data = (await res.json()) as LoginResponse;
  writeCredentials({ apiUrl, accessToken: data.accessToken, refreshToken: data.refreshToken });
  console.log(`Connecté en tant que ${data.user.pseudo}.`);
}
