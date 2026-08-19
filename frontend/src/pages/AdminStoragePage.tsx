import { useCallback, useEffect, useState } from "react";
import { HardDrive, RefreshCw } from "lucide-react";
import { getStorageUsage, type StorageUsage } from "../api/admin";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} Mo`;
  return `${(mb / 1024).toFixed(2)} Go`;
}

export default function AdminStoragePage() {
  const [usage, setUsage] = useState<StorageUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStorageUsage();
      setUsage(data);
    } catch {
      setError("Impossible de mesurer l'espace de stockage pour le moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
        <HardDrive size={24} />
        <h1>Espace de stockage</h1>
      </div>
      <p className="muted">Espace utilisé dans le stockage de fichiers de l'application (archives de ressources, icônes, avatars).</p>

      <button type="button" className="btn" onClick={load} disabled={loading} style={{ margin: "var(--space-3) 0" }}>
        <RefreshCw size={14} />
        Rafraîchir
      </button>

      {error && <p className="alert alert-error" role="alert">{error}</p>}

      {loading && !usage && <p>Chargement...</p>}

      {usage && (
        <>
          <div className="card">
            <h3>Total</h3>
            <p style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>{formatBytes(usage.totalBytes)}</p>
            <p className="muted" style={{ marginBottom: 0 }}>Mesuré le {new Date(usage.computedAt).toLocaleString()}</p>
          </div>

          <h2 style={{ marginTop: "var(--space-5)" }}>Répartition par catégorie</h2>
          <ul className="list">
            {usage.buckets.map((b) => (
              <li key={b.bucket} className="list-item">
                <div className="list-item-main">
                  <span className="list-item-title">{b.label}</span>
                  <span className="list-item-meta">{b.objectCount} fichier{b.objectCount !== 1 ? "s" : ""}</span>
                </div>
                <span className="badge">{formatBytes(b.totalBytes)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
