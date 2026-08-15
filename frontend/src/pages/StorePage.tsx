import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
      <nav>
        <Link to="/teams">Équipes</Link> <Link to="/profile">Mon profil</Link>
      </nav>
      <h1>Store</h1>
      {resources.length === 0 && <p>Aucune ressource visible pour le moment.</p>}
      <ul>
        {resources.map((r) => (
          <li key={r.id}>
            <Link to={`/resources/${r.id}`}>{r.name}</Link> ({r.type}, équipe {r.teamName}, par{" "}
            {r.publisherPseudo}, {r.upvoteCount} upvote{r.upvoteCount > 1 ? "s" : ""})
          </li>
        ))}
      </ul>
    </div>
  );
}
