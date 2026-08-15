import { clearCredentials, readCredentials, writeCredentials, type Credentials } from "./credentials.js";

export class CliError extends Error {
  constructor(message: string, public exitCode: number = 1) {
    super(message);
  }
}

export class ApiClient {
  constructor(private apiUrl: string) {}

  private async refresh(credentials: Credentials): Promise<Credentials | null> {
    const res = await fetch(`${this.apiUrl}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: credentials.refreshToken }),
    });
    if (!res.ok) return null;

    const data = (await res.json()) as { accessToken: string; refreshToken: string };
    const updated: Credentials = { apiUrl: this.apiUrl, accessToken: data.accessToken, refreshToken: data.refreshToken };
    writeCredentials(updated);
    return updated;
  }

  async request(path: string, options: RequestInit = {}): Promise<Response> {
    let credentials = readCredentials();
    if (!credentials) {
      throw new CliError('Non connecté. Lancez "skillforge login".');
    }

    const doFetch = (token: string) =>
      fetch(`${this.apiUrl}${path}`, {
        ...options,
        headers: { ...(options.headers ?? {}), Authorization: `Bearer ${token}` },
      });

    let res = await doFetch(credentials.accessToken);

    if (res.status === 401) {
      const refreshed = await this.refresh(credentials);
      if (!refreshed) {
        clearCredentials();
        throw new CliError('Session expirée. Lancez "skillforge login".');
      }
      credentials = refreshed;
      res = await doFetch(credentials.accessToken);
    }

    return res;
  }

  async requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await this.request(path, options);
    if (!res.ok) {
      throw new CliError(await describeError(res));
    }
    return (await res.json()) as T;
  }
}

export async function describeError(res: Response): Promise<string> {
  if (res.status === 403) return "Droits insuffisants pour cette action.";
  if (res.status === 404) return "Ressource introuvable ou non accessible.";
  if (res.status === 409) {
    const body = await res.json().catch(() => null);
    return body?.message ?? "Conflit (nom déjà utilisé).";
  }
  const body = await res.json().catch(() => null);
  return body?.message ?? `Erreur inattendue (HTTP ${res.status}).`;
}
