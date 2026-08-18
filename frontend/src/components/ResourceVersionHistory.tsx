import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { getVersionDownloadUrl, listResourceVersions, type ResourceVersion } from "../api/resources";

interface ResourceVersionHistoryProps {
  resourceId: string;
}

export default function ResourceVersionHistory({ resourceId }: ResourceVersionHistoryProps) {
  const [versions, setVersions] = useState<ResourceVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    listResourceVersions(resourceId)
      .then((v) => {
        if (!cancelled) setVersions(v);
      })
      .catch(() => {
        if (!cancelled) setVersions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  const handleDownload = async (versionNumber: number) => {
    const { downloadUrl } = await getVersionDownloadUrl(resourceId, versionNumber);
    window.open(downloadUrl, "_blank");
  };

  if (loading || versions.length === 0) return null;

  return (
    <section className="card-section">
      <h2>Historique des versions ({versions.length})</h2>
      <ul className="list">
        {versions.map((v) => (
          <li key={v.versionNumber} className="list-item">
            <div className="list-item-main">
              <span className="list-item-title">
                Version {v.versionNumber}
                {v.isCurrent && <span className="badge badge-accent">actuelle</span>}
              </span>
              <span className="list-item-meta">
                {new Date(v.createdAt).toLocaleString()} · par {v.publisherPseudo}
              </span>
              {v.note && <p className="muted">{v.note}</p>}
            </div>
            <button type="button" className="btn" onClick={() => handleDownload(v.versionNumber)}>
              <Download size={14} />
              Télécharger
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
