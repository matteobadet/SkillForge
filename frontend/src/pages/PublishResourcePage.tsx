import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { publishResource, type ResourceType } from "../api/resources";

export default function PublishResourcePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("Skill");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamId || !file) return;
    setError(null);
    setSubmitting(true);
    try {
      const resource = await publishResource(teamId, name, description, type, file);
      navigate(`/resources/${resource.id}`);
    } catch {
      setError("Échec de la publication (nom déjà pris, ou fichier invalide — .zip, 50 Mo max).");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h1>Publier une ressource</h1>
      <label>
        Nom
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>
      <label>
        Type
        <select value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
          <option value="Skill">Skill</option>
          <option value="MCP">MCP</option>
          <option value="Agent">Agent</option>
        </select>
      </label>
      <label>
        Archive (.zip, 50 Mo max)
        <input type="file" accept=".zip" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={submitting || !file}>Publier</button>
    </form>
  );
}
