import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowBigUp, Search } from "lucide-react";
import { listStoreResources, type ResourceSummary, type ResourceType } from "../api/resources";
import { filterResources } from "../lib/filter";
import EntityIcon from "../components/EntityIcon";
import { defaultResourceIcon } from "../icons/presets";

export default function StorePage() {
  const [resources, setResources] = useState<ResourceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<ResourceType | "">("");

  useEffect(() => {
    listStoreResources().then(setResources).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => filterResources(resources, { query, type }), [resources, query, type]);

  if (loading) return <p>Chargement...</p>;

  return (
    <div>
      <h1>Store</h1>

      {resources.length > 0 && (
        <div style={{ display: "flex", gap: "var(--space-2)", marginBottom: "var(--space-3)" }}>
          <label className="field" style={{ flex: 1 }}>
            <span style={{ display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
              <Search size={14} />
              Rechercher
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nom, équipe, publieur..."
            />
          </label>
          <label className="field">
            Type
            <select value={type} onChange={(e) => setType(e.target.value as ResourceType | "")}>
              <option value="">Tous</option>
              <option value="Skill">Skill</option>
              <option value="MCP">MCP</option>
              <option value="Agent">Agent</option>
            </select>
          </label>
        </div>
      )}

      {resources.length === 0 ? (
        <p className="empty-state">Aucune ressource visible pour le moment.</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">Aucun résultat pour ces critères.</p>
      ) : (
        <div className="card-grid">
          {filtered.map((r) => (
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
