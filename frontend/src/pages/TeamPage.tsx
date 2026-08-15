import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowBigUp, Copy, LogOut, Plus, RefreshCw, Save, Trash2, UserMinus, Lock, Globe } from "lucide-react";
import {
  deleteTeam,
  getInviteLink,
  getTeam,
  leaveTeam,
  regenerateInviteLink,
  removeMember,
  updateTeam,
  uploadTeamIcon,
  type TeamDetail,
} from "../api/teams";
import { listTeamResources, type ResourceSummary } from "../api/resources";
import { useAuth } from "../auth/AuthContext";
import EntityIcon from "../components/EntityIcon";
import IconPicker, { type IconPickerValue } from "../components/IconPicker";
import { DEFAULT_TEAM_ICON, defaultResourceIcon } from "../icons/presets";

export default function TeamPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [failedAvatars, setFailedAvatars] = useState<Set<string>>(new Set());

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
      const teamResources = await listTeamResources(id);
      setResources(teamResources);
    } catch {
      setNotFound(true);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) return <p className="empty-state">Équipe introuvable.</p>;
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

  const handleIconChange = async (value: IconPickerValue) => {
    setError(null);
    try {
      const updated = value.file ? await uploadTeamIcon(team.id, value.file) : await updateTeam(team.id, { iconPreset: value.preset ?? "" });
      setTeam(updated);
    } catch {
      setError("Échec de la mise à jour de l'icône.");
    }
  };

  const handleRegenerateLink = async () => {
    const link = await regenerateInviteLink(team.id);
    setInviteUrl(link.inviteUrl);
  };

  const handleCopyLink = () => {
    if (inviteUrl) navigator.clipboard.writeText(inviteUrl);
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
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <EntityIcon iconUrl={team.iconUrl} iconPreset={team.iconPreset} fallback={DEFAULT_TEAM_ICON} />
        <h1 style={{ margin: 0 }}>{team.name}</h1>
        <span className="badge">
          {team.visibility === "Public" ? <Globe size={12} /> : <Lock size={12} />}
          {team.visibility === "Public" ? "Publique" : "Privée"}
        </span>
      </div>
      {team.description && <p className="muted">{team.description}</p>}

      <h2>Membres ({team.members.length})</h2>
      <ul className="list">
        {team.members.map((m) => (
          <li key={m.userId} className="list-item">
            <div className="list-item-main" style={{ flexDirection: "row", alignItems: "center", gap: "var(--space-2)" }}>
              {m.avatarUrl && !failedAvatars.has(m.userId) ? (
                <img
                  src={m.avatarUrl}
                  alt=""
                  className="avatar"
                  onError={() => setFailedAvatars((prev) => new Set(prev).add(m.userId))}
                />
              ) : (
                <span className="avatar" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-subtle)", fontSize: 12 }}>
                  {m.pseudo.slice(0, 1).toUpperCase()}
                </span>
              )}
              <span className="list-item-title">{m.pseudo}</span>
              <span className="badge">{m.role}</span>
            </div>
            {isOwner && m.role !== "Owner" && (
              <button type="button" className="btn-danger" onClick={() => handleRemoveMember(m.userId)}>
                <UserMinus size={14} />
                Retirer
              </button>
            )}
          </li>
        ))}
      </ul>

      <h2>Ressources ({resources.length})</h2>
      {isMember && (
        <Link to={`/teams/${team.id}/resources/new`} className="btn btn-primary" style={{ marginBottom: "var(--space-3)" }}>
          <Plus size={16} />
          Publier une ressource
        </Link>
      )}
      {resources.length === 0 ? (
        <p className="empty-state">Aucune ressource dans cette équipe.</p>
      ) : (
        <div className="card-grid">
          {resources.map((r) => (
            <Link to={`/resources/${r.id}`} key={r.id} className="entity-card">
              <EntityIcon iconUrl={r.iconUrl} iconPreset={r.iconPreset} fallback={defaultResourceIcon(r.type)} />
              <div className="entity-card-body">
                <span className="entity-card-title">{r.name}</span>
                <span className="entity-card-meta">par {r.publisherPseudo}</span>
                <div className="entity-card-footer">
                  <span className="badge">
                    <ArrowBigUp size={12} />
                    {r.upvoteCount}
                  </span>
                  <span className="badge badge-accent">{r.type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isMember && !isOwner && (
        <button type="button" className="btn-danger" onClick={handleLeave}>
          <LogOut size={16} />
          Quitter l'équipe
        </button>
      )}

      {isOwner && (
        <section className="card-section">
          <h2>Gestion (Owner)</h2>

          <div className="card">
            <h3>Lien d'invitation</h3>
            {inviteUrl ? (
              <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
                <code style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{inviteUrl}</code>
                <button type="button" className="btn" onClick={handleCopyLink}>
                  <Copy size={14} />
                  Copier
                </button>
              </div>
            ) : (
              <p className="muted">Aucun lien actif.</p>
            )}
            <button type="button" className="btn" onClick={handleRegenerateLink} style={{ marginTop: "var(--space-2)" }}>
              <RefreshCw size={14} />
              Régénérer le lien
            </button>
          </div>

          <div className="card" style={{ marginTop: "var(--space-3)" }}>
            <h3>Icône</h3>
            <IconPicker value={{ preset: team.iconPreset, file: null }} onChange={handleIconChange} />
          </div>

          <form onSubmit={handleUpdate} className="card" style={{ marginTop: "var(--space-3)" }}>
            <h3>Modifier l'équipe</h3>
            <label className="field">
              Nom
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={64} />
            </label>
            <label className="field">
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
            </label>
            <button type="submit" className="btn-primary">
              <Save size={16} />
              Enregistrer
            </button>
          </form>

          {error && <p className="alert alert-error" role="alert">{error}</p>}

          <button type="button" className="btn-danger" onClick={handleDelete} style={{ marginTop: "var(--space-3)" }}>
            <Trash2 size={16} />
            Supprimer l'équipe
          </button>
        </section>
      )}

      {user && !isMember && <p className="alert" style={{ marginTop: "var(--space-4)" }}>Vous n'êtes pas membre de cette équipe.</p>}
    </div>
  );
}
