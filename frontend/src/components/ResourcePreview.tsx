import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { getResourcePreview } from "../api/resources";

interface ResourcePreviewProps {
  resourceId: string;
}

type PreviewState = "loading" | "available" | "unavailable";

export default function ResourcePreview({ resourceId }: ResourcePreviewProps) {
  const [state, setState] = useState<PreviewState>("loading");
  const [content, setContent] = useState("");
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setState("loading");

    getResourcePreview(resourceId)
      .then((preview) => {
        if (cancelled) return;
        if (preview.available && preview.content) {
          setContent(preview.content);
          setTruncated(preview.truncated);
          setState("available");
        } else {
          setState("unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) setState("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

  if (state === "loading") {
    return <p className="muted">Chargement de l'aperçu...</p>;
  }

  if (state === "unavailable") {
    return <p className="muted">Aucun aperçu disponible pour cette ressource.</p>;
  }

  return (
    <section className="card resource-preview">
      <div className="resource-preview-content">
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
      </div>
      {truncated && (
        <p className="muted resource-preview-truncated">
          Aperçu tronqué — téléchargez l'archive pour le contenu complet.
        </p>
      )}
    </section>
  );
}
