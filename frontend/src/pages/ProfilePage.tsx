import { useState, type ChangeEvent, type FormEvent } from "react";
import { Save, Upload } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch, ApiError } from "../api/client";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [pseudo, setPseudo] = useState(user?.pseudo ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  if (!user) return null;

  const handlePseudoSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      const response = await apiFetch("/api/users/me", {
        method: "PATCH",
        body: JSON.stringify({ pseudo }),
      });
      if (!response.ok) {
        const body = await response.json();
        throw new ApiError(response.status, body);
      }
      await refreshUser();
      setMessage("Pseudo mis à jour.");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError("Ce pseudo est déjà pris.");
      } else {
        setError("Une erreur est survenue.");
      }
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await apiFetch("/api/users/me/avatar", { method: "POST", body: formData });
      if (!response.ok) {
        throw new ApiError(response.status, await response.json().catch(() => null));
      }
      await refreshUser();
      setAvatarFailed(false);
      setMessage("Avatar mis à jour.");
    } catch {
      setError("Échec de l'upload de l'avatar.");
    }
  };

  return (
    <div>
      <h1>Mon profil</h1>
      <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        {user.avatarUrl && !avatarFailed ? (
          <img
            src={user.avatarUrl}
            alt="Avatar"
            width={64}
            height={64}
            className="avatar"
            style={{ width: 64, height: 64 }}
            onError={() => setAvatarFailed(true)}
          />
        ) : (
          <div className="avatar" style={{ width: 64, height: 64, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-subtle)" }}>
            {user.pseudo.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p className="list-item-title" style={{ margin: 0 }}>{user.pseudo}</p>
          <p className="muted" style={{ margin: 0 }}>{user.email}</p>
          <span className="badge badge-accent">{user.role}</span>
        </div>
      </div>

      <div className="card-section">
        <h2>Modifier le pseudo</h2>
        <form onSubmit={handlePseudoSubmit}>
          <label className="field">
            Pseudo
            <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} minLength={3} maxLength={32} required />
          </label>
          <button type="submit" className="btn-primary">
            <Save size={16} />
            Enregistrer
          </button>
        </form>
      </div>

      <div className="card-section">
        <h2>Avatar</h2>
        <label className="field">
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Upload size={16} />
            Changer d'avatar
          </span>
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
        </label>
      </div>

      {message && <p className="alert alert-success" role="status">{message}</p>}
      {error && <p className="alert alert-error" role="alert">{error}</p>}
    </div>
  );
}
