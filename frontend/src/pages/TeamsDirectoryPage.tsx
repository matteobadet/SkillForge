import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Plus, Globe } from "lucide-react";
import { listMyTeams, listPublicTeams, type TeamSummary } from "../api/teams";
import EntityIcon from "../components/EntityIcon";
import { DEFAULT_TEAM_ICON } from "../icons/presets";

function TeamList({ teams }: { teams: TeamSummary[] }) {
  if (teams.length === 0) return <p className="empty-state">Aucune équipe.</p>;
  return (
    <div className="card-grid">
      {teams.map((t) => (
        <Link to={`/teams/${t.id}`} key={t.id} className="entity-card">
          <EntityIcon iconUrl={t.iconUrl} iconPreset={t.iconPreset} fallback={DEFAULT_TEAM_ICON} />
          <div className="entity-card-body">
            <span className="entity-card-title">{t.name}</span>
            <span className="entity-card-meta">
              {t.memberCount} membre{t.memberCount > 1 ? "s" : ""}
              {t.myRole ? ` · ${t.myRole}` : ""}
            </span>
            <div className="entity-card-footer">
              <span className="badge">
                {t.visibility === "Public" ? <Globe size={12} /> : <Lock size={12} />}
                {t.visibility === "Public" ? "Publique" : "Privée"}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function TeamsDirectoryPage() {
  const [myTeams, setMyTeams] = useState<TeamSummary[]>([]);
  const [publicTeams, setPublicTeams] = useState<TeamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listMyTeams(), listPublicTeams()])
      .then(([mine, pub]) => {
        setMyTeams(mine);
        setPublicTeams(pub);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h1>Équipes</h1>
        <Link to="/teams/new" className="btn btn-primary">
          <Plus size={16} />
          Créer une équipe
        </Link>
      </div>

      <h2>Mes équipes</h2>
      <TeamList teams={myTeams} />

      <h2>Équipes publiques</h2>
      <TeamList teams={publicTeams} />
    </div>
  );
}
