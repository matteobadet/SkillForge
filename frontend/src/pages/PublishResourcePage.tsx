import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { UploadCloud } from "lucide-react";
import { publishResource, uploadResourceIcon, type ResourceType } from "../api/resources";
import IconPicker, { type IconPickerValue } from "../components/IconPicker";
import FileInput from "../components/FileInput";

export default function PublishResourcePage() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<ResourceType>("Skill");
  const [file, setFile] = useState<File | null>(null);
  const [icon, setIcon] = useState<IconPickerValue>({ preset: null, file: null });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!teamId || !file) return;
    setError(null);
    setSubmitting(true);
    try {
      const resource = await publishResource(teamId, name, description, type, file, icon.preset);
      if (icon.file) {
        await uploadResourceIcon(resource.id, icon.file);
      }
      navigate(`/resources/${resource.id}`);
    } catch {
      setError("Échec de la publication (nom déjà pris, ou fichier invalide — .zip, 50 Mo max).");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1>Publier une ressource</h1>
      <form onSubmit={handleSubmit} className="card">
        <label className="field">
          Nom
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label className="field">
          Description
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <label className="field">
          Type
          <select value={type} onChange={(e) => setType(e.target.value as ResourceType)}>
            <option value="Skill">Skill</option>
            <option value="MCP">MCP</option>
            <option value="Agent">Agent</option>
          </select>
        </label>
        <IconPicker value={icon} onChange={setIcon} />
        <div className="field">
          <span>Archive</span>
          <FileInput accept=".zip" placeholder="Choisir une archive .zip (50 Mo max)" file={file} onChange={setFile} />
        </div>
        {error && <p className="alert alert-error" role="alert">{error}</p>}
        <button type="submit" className="btn-primary" disabled={submitting || !file}>
          <UploadCloud size={16} />
          Publier
        </button>
      </form>
    </div>
  );
}
