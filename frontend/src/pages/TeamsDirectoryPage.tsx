import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listMyTeams, listPublicTeams, type TeamSummary } from "../api/teams";

function TeamList({ teams }: { teams: TeamSummary[] }) {
  if (teams.length === 0) return <p>Aucune équipe.</p>;
  return (
    <ul>
      {teams.map((t) => (
        <li key={t.id}>
          <Link to={`/teams/${t.id}`}>{t.name}</Link>{" "}
          <span>({t.visibility === "Public" ? "publique" : "privée"}, {t.memberCount} membre{t.memberCount > 1 ? "s" : ""}{t.myRole ? `, ${t.myRole}` : ""})</span>
        </li>
      ))}
    </ul>
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
      <h1>Équipes</h1>
      <Link to="/teams/new">Créer une équipe</Link>

      <h2>Mes équipes</h2>
      <TeamList teams={myTeams} />

      <h2>Équipes publiques</h2>
      <TeamList teams={publicTeams} />
    </div>
  );
}
