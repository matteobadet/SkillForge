import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { joinTeam, type TeamDetail } from "../api/teams";
import { ApiError } from "../api/client";

export default function JoinTeamPage() {
  const { token } = useParams<{ token: string }>();
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const requestedToken = useRef<string | null>(null);

  useEffect(() => {
    if (!token || requestedToken.current === token) return;
    requestedToken.current = token;
    joinTeam(token)
      .then(setTeam)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          setError("Ce lien d'invitation est invalide ou a été révoqué.");
        } else {
          setError("Une erreur est survenue.");
        }
      });
  }, [token]);

  if (error) return <p role="alert">{error}</p>;
  if (!team) return <p>Adhésion en cours...</p>;

  return (
    <div>
      <p>Vous avez rejoint l'équipe "{team.name}".</p>
      <Link to={`/teams/${team.id}`}>Voir l'équipe</Link>
    </div>
  );
}
