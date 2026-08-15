import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  deleteTeam,
  getInviteLink,
  getTeam,
  leaveTeam,
  regenerateInviteLink,
  removeMember,
  updateTeam,
  type TeamDetail,
} from "../api/teams";
import { useAuth } from "../auth/AuthContext";

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const isOwner = team?.myRole === "Owner";
  const isMember = team?.myRole !== null && team?.myRole !== undefined;

  const load = async () => {
    if (!id) return;
    try {
      const t = await getTeam(id);
      setTeam(t);
      setName(t.name);
      setDescription(t.description ?? "");
      if (t.myRole === "Owner") {
        const link = await getInviteLink(id);
        setInviteUrl(link.inviteUrl);
      }
    } catch {
      setNotFound(true);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) return <p>Équipe introuvable.</p>;
  if (!team) return <p>Chargement...</p>;

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const updated = await updateTeam(team.id, { name, description });
      setTeam(updated);
    } catch {
      setError("Échec de la mise à jour.");
    }
  };

  const handleRegenerateLink = async () => {
    const link = await regenerateInviteLink(team.id);
    setInviteUrl(link.inviteUrl);
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement l'équipe "${team.name}" ?`)) return;
    await deleteTeam(team.id);
    navigate("/teams");
  };

  const handleLeave = async () => {
    await leaveTeam(team.id);
    navigate("/teams");
  };

  const handleRemoveMember = async (userId: string) => {
    await removeMember(team.id, userId);
    load();
  };

  return (
    <div>
      <h1>{team.name}</h1>
      <p>{team.description}</p>
      <p>Visibilité : {team.visibility === "Public" ? "Publique" : "Privée"}</p>

      <h2>Membres ({team.members.length})</h2>
      <ul>
        {team.members.map((m) => (
          <li key={m.userId}>
            {m.avatarUrl && <img src={m.avatarUrl} alt="" width={24} height={24} />} {m.pseudo} ({m.role})
            {isOwner && m.role !== "Owner" && (
              <button type="button" onClick={() => handleRemoveMember(m.userId)}>Retirer</button>
            )}
          </li>
        ))}
      </ul>

      {isMember && !isOwner && (
        <button type="button" onClick={handleLeave}>Quitter l'équipe</button>
      )}

      {isOwner && (
        <section>
          <h2>Gestion (Owner)</h2>

          <div>
            <h3>Lien d'invitation</h3>
            {inviteUrl ? <p>{inviteUrl}</p> : <p>Aucun lien actif.</p>}
            <button type="button" onClick={handleRegenerateLink}>Régénérer le lien</button>
          </div>

          <form onSubmit={handleUpdate}>
            <h3>Modifier l'équipe</h3>
            <label>
              Nom
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />
            </label>
            <label>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </label>
            <button type="submit">Enregistrer</button>
          </form>

          {error && <p role="alert">{error}</p>}

          <button type="button" onClick={handleDelete}>Supprimer l'équipe</button>
        </section>
      )}

      {user && !isMember && <p>Vous n'êtes pas membre de cette équipe.</p>}
    </div>
  );
}
