import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { createTeam, uploadTeamIcon, type TeamVisibility } from "../api/teams";
import IconPicker, { type IconPickerValue } from "../components/IconPicker";

export default function CreateTeamPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<TeamVisibility>("Public");
  const [icon, setIcon] = useState<IconPickerValue>({ preset: null, file: null });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const team = await createTeam(name, description, visibility, icon.preset);
      if (icon.file) {
        await uploadTeamIcon(team.id, icon.file);
      }
      navigate(`/teams/${team.id}`);
    } catch {
      setError("Une erreur est survenue. Réessayez.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Créer une équipe</h1>
      <form onSubmit={handleSubmit} className="card">
        <label className="field">
          Nom
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required maxLength={64} />
        </label>
        <label className="field">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </label>
        <IconPicker value={icon} onChange={setIcon} />
        <fieldset>
          <legend>Visibilité</legend>
          <label className="field field-inline">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "Public"}
              onChange={() => setVisibility("Public")}
            />
            Publique (visible et consultable par tous les utilisateurs connectés)
          </label>
          <label className="field field-inline">
            <input
              type="radio"
              name="visibility"
              checked={visibility === "Prive"}
              onChange={() => setVisibility("Prive")}
            />
            Privée (visible uniquement par ses membres, accessible par lien d'invitation)
          </label>
        </fieldset>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting}>
          <Plus size={16} />
          Créer l'équipe
        </button>
      </form>
    </div>
  );
}
