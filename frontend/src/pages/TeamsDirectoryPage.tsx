import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Lock, Plus, Globe, Search } from "lucide-react";
import { listMyTeams, listPublicTeams, type TeamSummary } from "../api/teams";
import { filterTeams } from "../lib/filter";
import EntityIcon from "../components/EntityIcon";
import { DEFAULT_TEAM_ICON } from "../icons/presets";

function TeamList({ teams, emptyMessage }: { teams: TeamSummary[]; emptyMessage: string }) {
  if (teams.length === 0) return <p className="empty-state">{emptyMessage}</p>;
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
            {t.description && <p className="entity-card-snippet">{t.description}</p>}
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
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([listMyTeams(), listPublicTeams()])
      .then(([mine, pub]) => {
        setMyTeams(mine);
        setPublicTeams(pub);
      })
      .finally(() => setLoading(false));
  }, []);

  const hasAnyTeam = myTeams.length > 0 || publicTeams.length > 0;
  const filteredMine = useMemo(() => filterTeams(myTeams, { query }), [myTeams, query]);
  const filteredPublic = useMemo(() => filterTeams(publicTeams, { query }), [publicTeams, query]);

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

      {hasAnyTeam && (
        <label className="field" style={{ maxWidth: 360, marginBottom: "var(--space-3)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            <Search size={14} />
            Rechercher une équipe
          </span>
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Nom de l'équipe..." />
        </label>
      )}

      <h2>Mes équipes</h2>
      <TeamList teams={filteredMine} emptyMessage={query ? "Aucun résultat pour ces critères." : "Aucune équipe."} />

      <h2>Équipes publiques</h2>
      <TeamList teams={filteredPublic} emptyMessage={query ? "Aucun résultat pour ces critères." : "Aucune équipe."} />
    </div>
  );
}
