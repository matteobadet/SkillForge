import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { createTeam, type TeamVisibility } from "../api/teams";

export default function CreateTeamPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<TeamVisibility>("Public");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const team = await createTeam(name, description, visibility);
      navigate(`/teams/${team.id}`);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Créer une équipe</h1>
      <label>
        Nom
        <input value={name} onChange={(e) => setName(e.target.value)} required maxLength={64} />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
      </label>
      <fieldset>
        <legend>Visibilité</legend>
        <label>
          <input
            type="radio"
            name="visibility"
            checked={visibility === "Public"}
            onChange={() => setVisibility("Public")}
          />
          Publique (visible et consultable par tous les utilisateurs connectés)
        </label>
        <label>
          <input
            type="radio"
            name="visibility"
            checked={visibility === "Prive"}
            onChange={() => setVisibility("Prive")}
          />
          Privée (visible uniquement par ses membres, accessible par lien d'invitation)
        </label>
      </fieldset>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting}>Créer l'équipe</button>
    </form>
  );
}
