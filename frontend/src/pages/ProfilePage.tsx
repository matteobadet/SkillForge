import { useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { apiFetch } from "../api/client";
import FileInput from "../components/FileInput";
import InlineEditable from "../components/InlineEditable";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [avatarMessage, setAvatarMessage] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);
  const [avatarUploadKey, setAvatarUploadKey] = useState(0);

  if (!user) return null;

  const handleSavePseudo = async (value: string) => {
    const response = await apiFetch("/api/users/me", {
      method: "PATCH",
      body: JSON.stringify({ pseudo: value }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? "Échec de la mise à jour du pseudo.");
    }
    await refreshUser();
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file) return;
    setAvatarError(null);
    setAvatarMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const response = await apiFetch("/api/users/me/avatar", { method: "POST", body: formData });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.message ?? "Échec de l'upload de l'avatar.");
      }
      await refreshUser();
      setAvatarFailed(false);
      setAvatarMessage("Avatar mis à jour.");
    } catch (err) {
      setAvatarError(err instanceof Error ? err.message : "Échec de l'upload de l'avatar.");
    } finally {
      setAvatarUploadKey((k) => k + 1);
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
          <InlineEditable
            as="p"
            className="list-item-title"
            value={user.pseudo}
            onSave={handleSavePseudo}
            canEdit
            ariaLabel="le pseudo"
            emptyText=""
            required
            minLength={3}
            maxLength={32}
          />
          <p className="muted" style={{ margin: 0 }}>{user.email}</p>
          <span className="badge badge-accent">{user.role}</span>
        </div>
      </div>

      <div className="card-section">
        <h2>Avatar</h2>
        <FileInput
          key={avatarUploadKey}
          accept="image/jpeg,image/png,image/webp"
          placeholder="Changer d'avatar (jpeg/png/webp, 5 Mo max)"
          file={null}
          onChange={handleAvatarChange}
        />
        {avatarMessage && <p className="alert alert-success" role="status">{avatarMessage}</p>}
        {avatarError && <p className="alert alert-error" role="alert">{avatarError}</p>}
      </div>
    </div>
  );
}
