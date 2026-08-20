import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import { ChevronDown, ChevronUp } from "lucide-react";
import { getResourcePreview } from "../api/resources";

interface ResourcePreviewProps {
  resourceId: string;
}

type PreviewState = "loading" | "available" | "unavailable";

// Au-delà de cette hauteur, un long SKILL.md noierait le reste de la page
// (historique des versions, gestion) sous un mur de texte — on replie par défaut.
const COLLAPSED_HEIGHT = 420;

export default function ResourcePreview({ resourceId }: ResourcePreviewProps) {
  const [state, setState] = useState<PreviewState>("loading");
  const [content, setContent] = useState("");
  const [truncated, setTruncated] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    setExpanded(false);

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

  useEffect(() => {
    if (state !== "available" || !contentRef.current) return;
    setOverflowing(contentRef.current.scrollHeight > COLLAPSED_HEIGHT);
  }, [state, content]);

  if (state === "loading") {
    return <p className="muted">Chargement de l'aperçu...</p>;
  }

  if (state === "unavailable") {
    return <p className="muted">Aucun aperçu disponible pour cette ressource.</p>;
  }

  const collapsed = overflowing && !expanded;

  return (
    <section className="card resource-preview">
      <div
        ref={contentRef}
        className={collapsed ? "resource-preview-content resource-preview-collapsed" : "resource-preview-content"}
      >
        <ReactMarkdown rehypePlugins={[rehypeSanitize]}>{content}</ReactMarkdown>
      </div>
      {overflowing && (
        <button type="button" className="btn resource-preview-toggle" onClick={() => setExpanded((e) => !e)}>
          {expanded ? (
            <>
              <ChevronUp size={14} />
              Réduire
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              Voir la suite
            </>
          )}
        </button>
      )}
      {truncated && (
        <p className="muted resource-preview-truncated">
          Aperçu tronqué — téléchargez l'archive pour le contenu complet.
        </p>
      )}
    </section>
  );
}
