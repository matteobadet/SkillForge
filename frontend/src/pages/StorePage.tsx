import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowBigUp } from "lucide-react";
import { listStoreResources, type ResourceSummary } from "../api/resources";
import EntityIcon from "../components/EntityIcon";
import { defaultResourceIcon } from "../icons/presets";

export default function StorePage() {
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listStoreResources().then(setResources).finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Store</h1>
      {resources.length === 0 ? (
        <p className="empty-state">Aucune ressource visible pour le moment.</p>
      ) : (
        <div className="card-grid">
          {resources.map((r) => (
            <Link to={`/resources/${r.id}`} key={r.id} className="entity-card">
              <EntityIcon iconUrl={r.iconUrl} iconPreset={r.iconPreset} fallback={defaultResourceIcon(r.type)} />
              <div className="entity-card-body">
                <span className="entity-card-title">{r.name}</span>
                <span className="entity-card-meta">
                  équipe {r.teamName} · par {r.publisherPseudo}
                </span>
                <div className="entity-card-footer">
                  <span className="badge">
                    <ArrowBigUp size={12} />
                    {r.upvoteCount}
                  </span>
                  <span className="badge badge-accent">{r.type}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
