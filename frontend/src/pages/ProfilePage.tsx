import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { apiFetch, ApiError } from "../api/client";

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [pseudo, setPseudo] = useState(user?.pseudo ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      setMessage("Avatar mis à jour.");
    } catch {
      setError("Échec de l'upload de l'avatar.");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Mon profil</h1>
      {user.avatarUrl && <img src={user.avatarUrl} alt="Avatar" width={96} height={96} />}
      <p>Email : {user.email}</p>
      <p>Rôle : {user.role}</p>

      <form onSubmit={handlePseudoSubmit}>
        <label>
          Pseudo
          <input value={pseudo} onChange={(e) => setPseudo(e.target.value)} minLength={3} maxLength={32} required />
        </label>
        <button type="submit">Enregistrer</button>
      </form>

      <label>
        Changer d'avatar
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleAvatarChange} />
      </label>

      {message && <p role="status">{message}</p>}
      {error && <p role="alert">{error}</p>}

      <button type="button" onClick={handleLogout}>Se déconnecter</button>
    </div>
  );
}
