import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowBigUp, Download, ShieldAlert, Trash2, UploadCloud } from "lucide-react";
import { ApiError } from "../api/client";
import {
  deleteResource,
  getDownloadUrl,
  getResource,
  toggleUpvote,
  updateResource,
  uploadResourceIcon,
  type ResourceDetail,
} from "../api/resources";
import ConfirmDialog from "../components/ConfirmDialog";
import EntityIcon from "../components/EntityIcon";
import FileInput from "../components/FileInput";
import IconPicker, { type IconPickerValue } from "../components/IconPicker";
import InlineEditable from "../components/InlineEditable";
import ResourcePreview from "../components/ResourcePreview";
import ResourceVersionHistory from "../components/ResourceVersionHistory";
import { defaultResourceIcon } from "../icons/presets";

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const body = err.body as { message?: string } | null;
    if (body?.message) return body.message;
  }
  return fallback;
}

export default function ResourcePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<ResourceDetail | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [versionsRefreshKey, setVersionsRefreshKey] = useState(0);
  const [newArchive, setNewArchive] = useState<File | null>(null);
  const [versionNote, setVersionNote] = useState("");
  const [replacingArchive, setReplacingArchive] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const r = await getResource(id);
      setResource(r);
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

  const handleSaveName = async (value: string) => {
    try {
      const updated = await updateResource(resource.id, { name: value });
      setResource(updated);
    } catch (err) {
      throw new Error(messageOf(err, "Échec de la mise à jour du nom."));
    }
  };

  const handleSaveDescription = async (value: string) => {
    try {
      const updated = await updateResource(resource.id, { description: value });
      setResource(updated);
    } catch (err) {
      throw new Error(messageOf(err, "Échec de la mise à jour de la description."));
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

  const handleReplaceArchive = async (e: FormEvent) => {
    e.preventDefault();
    if (!newArchive) return;
    setError(null);
    setReplacingArchive(true);
    try {
      const updated = await updateResource(resource.id, { file: newArchive, note: versionNote || undefined });
      setResource(updated);
      setNewArchive(null);
      setVersionNote("");
      setVersionsRefreshKey((k) => k + 1);
    } catch (err) {
      setError(messageOf(err, "Échec du remplacement de l'archive."));
    } finally {
      setReplacingArchive(false);
    }
  };

  const handleDelete = async () => {
    setDeleteConfirmOpen(false);
    await deleteResource(resource.id);
    navigate(`/teams/${resource.teamId}`);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <EntityIcon iconUrl={resource.iconUrl} iconPreset={resource.iconPreset} fallback={defaultResourceIcon(resource.type)} />
        <InlineEditable
          as="h1"
          value={resource.name}
          onSave={handleSaveName}
          canEdit={resource.canManage}
          ariaLabel="le nom de la ressource"
          emptyText=""
          required
          maxLength={100}
        />
        <span className="badge badge-accent">{resource.type}</span>
      </div>
      <InlineEditable
        as="p"
        className="entity-description"
        value={resource.description ?? ""}
        onSave={handleSaveDescription}
        canEdit={resource.canManage}
        ariaLabel="la description de la ressource"
        emptyText={resource.canManage ? "Ajouter une description..." : ""}
        multiline
        maxLength={500}
      />
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

      <ResourcePreview resourceId={resource.id} />

      <ResourceVersionHistory key={versionsRefreshKey} resourceId={resource.id} />

      {(resource.canManage || resource.canDelete) && (
        <section className="card-section">
          <h2>Gestion</h2>
          {resource.canManage && (
            <div className="card">
              <h3>Icône</h3>
              <IconPicker value={{ preset: resource.iconPreset, file: null }} onChange={handleIconChange} />
            </div>
          )}
          {resource.canManage && (
            <form onSubmit={handleReplaceArchive} className="card" style={{ marginTop: "var(--space-3)" }}>
              <h3>Remplacer l'archive</h3>
              <div className="field">
                <span>Nouvelle archive</span>
                <FileInput accept=".zip" placeholder="Choisir une archive .zip (50 Mo max)" file={newArchive} onChange={setNewArchive} />
              </div>
              <label className="field">
                Note de version (optionnel)
                <input
                  type="text"
                  value={versionNote}
                  onChange={(e) => setVersionNote(e.target.value)}
                  maxLength={300}
                  placeholder="Ex : corrige un bug de parsing"
                />
              </label>
              <button type="submit" className="btn-primary" disabled={!newArchive || replacingArchive}>
                <UploadCloud size={16} />
                Publier cette version
              </button>
            </form>
          )}
          {error && <p className="alert alert-error" role="alert">{error}</p>}
          {resource.canDelete && (
            <button type="button" className="btn-danger" onClick={() => setDeleteConfirmOpen(true)} style={{ marginTop: "var(--space-3)" }}>
              {resource.canManage ? <Trash2 size={16} /> : <ShieldAlert size={16} />}
              {resource.canManage ? "Supprimer" : "Supprimer (modération admin)"}
            </button>
          )}
        </section>
      )}

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Supprimer la ressource"
        message={`Supprimer définitivement "${resource.name}" ? Cette action est irréversible et supprime aussi tout son historique de versions.`}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
  );
}
