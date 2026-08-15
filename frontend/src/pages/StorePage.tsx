import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowBigUp } from "lucide-react";
import { listStoreResources, type ResourceSummary } from "../api/resources";

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
        <ul className="list">
          {resources.map((r) => (
            <li key={r.id}>
              <Link to={`/resources/${r.id}`} className="list-item">
                <div className="list-item-main">
                  <span className="list-item-title">{r.name}</span>
                  <span className="list-item-meta">
                    équipe {r.teamName} · par {r.publisherPseudo}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", flexShrink: 0 }}>
                  <span className="badge">
                    <ArrowBigUp size={12} />
                    {r.upvoteCount}
                  </span>
                  <span className="badge badge-accent">{r.type}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
