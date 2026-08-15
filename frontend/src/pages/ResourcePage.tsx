import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowBigUp, Download, Save, ShieldAlert, Trash2 } from "lucide-react";
import {
  deleteResource,
  getDownloadUrl,
  getResource,
  toggleUpvote,
  updateResource,
  uploadResourceIcon,
  type ResourceDetail,
} from "../api/resources";
import EntityIcon from "../components/EntityIcon";
import IconPicker, { type IconPickerValue } from "../components/IconPicker";
import { defaultResourceIcon } from "../icons/presets";

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!id) return;
    try {
      const r = await getResource(id);
      setResource(r);
      setName(r.name);
      setDescription(r.description ?? "");
    } catch {
      setNotFound(true);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (notFound) return <p className="empty-state">Ressource introuvable.</p>;
  if (!resource) return <p>Chargement...</p>;

  const handleDownload = async () => {
    const { downloadUrl } = await getDownloadUrl(resource.id);
    window.open(downloadUrl, "_blank");
  };

  const handleUpvote = async () => {
    const result = await toggleUpvote(resource.id);
    setResource({ ...resource, upvoteCount: result.upvoteCount, upvotedByMe: result.upvotedByMe });
  };

  const handleUpdate = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const updated = await updateResource(resource.id, { name, description });
      setResource(updated);
    } catch {
      setError("Échec de la mise à jour (nom déjà pris ?).");
    }
  };

  const handleIconChange = async (value: IconPickerValue) => {
    setError(null);
    try {
      const updated = value.file
        ? await uploadResourceIcon(resource.id, value.file)
        : await updateResource(resource.id, { iconPreset: value.preset ?? "" });
      setResource(updated);
    } catch {
      setError("Échec de la mise à jour de l'icône.");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement "${resource.name}" ?`)) return;
    await deleteResource(resource.id);
    navigate(`/teams/${resource.teamId}`);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <EntityIcon iconUrl={resource.iconUrl} iconPreset={resource.iconPreset} fallback={defaultResourceIcon(resource.type)} />
        <h1 style={{ margin: 0 }}>{resource.name}</h1>
        <span className="badge badge-accent">{resource.type}</span>
      </div>
      {resource.description && <p className="entity-description">{resource.description}</p>}
      <p className="list-item-meta">
        Équipe : <Link to={`/teams/${resource.teamId}`}>{resource.teamName}</Link> · Publié par {resource.publisherPseudo}
      </p>

      <div style={{ display: "flex", gap: "var(--space-2)" }}>
        <button type="button" className="btn-primary" onClick={handleDownload}>
          <Download size={16} />
          Télécharger
        </button>
        <button type="button" className="btn" onClick={handleUpvote}>
          <ArrowBigUp size={16} />
          {resource.upvotedByMe ? "Retirer mon upvote" : "Upvote"} ({resource.upvoteCount})
        </button>
      </div>

      {(resource.canManage || resource.canDelete) && (
        <section className="card-section">
          <h2>Gestion</h2>
          {resource.canManage && (
            <>
              <div className="card">
                <h3>Icône</h3>
                <IconPicker value={{ preset: resource.iconPreset, file: null }} onChange={handleIconChange} />
              </div>
              <form onSubmit={handleUpdate} className="card" style={{ marginTop: "var(--space-3)" }}>
                <label className="field">
                  Nom
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} />
                </label>
                <label className="field">
                  Description
                  <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
                </label>
                <button type="submit" className="btn-primary">
                  <Save size={16} />
                  Enregistrer
                </button>
              </form>
            </>
          )}
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          {resource.canDelete && (
            <button type="button" className="btn-danger" onClick={handleDelete} style={{ marginTop: "var(--space-3)" }}>
              {resource.canManage ? <Trash2 size={16} /> : <ShieldAlert size={16} />}
              {resource.canManage ? "Supprimer" : "Supprimer (modération admin)"}
            </button>
          )}
        </section>
      )}
    </div>
  );
}
