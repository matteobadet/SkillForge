import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  deleteResource,
  getDownloadUrl,
  getResource,
  toggleUpvote,
  updateResource,
  type ResourceDetail,
} from "../api/resources";

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

  if (notFound) return <p>Ressource introuvable.</p>;
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

  const handleDelete = async () => {
    if (!confirm(`Supprimer définitivement "${resource.name}" ?`)) return;
    await deleteResource(resource.id);
    navigate(`/teams/${resource.teamId}`);
  };

  return (
    <div>
      <h1>{resource.name}</h1>
      <p>{resource.description}</p>
      <p>
        Type : {resource.type} — Équipe : <Link to={`/teams/${resource.teamId}`}>{resource.teamName}</Link> —
        Publié par {resource.publisherPseudo}
      </p>
      <button type="button" onClick={handleDownload}>Télécharger</button>
      <button type="button" onClick={handleUpvote}>
        {resource.upvotedByMe ? "Retirer mon upvote" : "Upvote"} ({resource.upvoteCount})
      </button>

      {resource.canManage && (
        <section>
          <h2>Gestion</h2>
          <form onSubmit={handleUpdate}>
            <label>
              Nom
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
              Description
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <button type="submit">Enregistrer</button>
          </form>
          {error && <p role="alert">{error}</p>}
          <button type="button" onClick={handleDelete}>Supprimer</button>
        </section>
      )}
    </div>
  );
}
