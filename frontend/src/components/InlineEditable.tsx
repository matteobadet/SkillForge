import { useEffect, useRef, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

interface InlineEditableProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  canEdit: boolean;
  ariaLabel: string;
  emptyText: string;
  as?: "h1" | "p";
  className?: string;
  multiline?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
}

export default function InlineEditable({
  value,
  onSave,
  canEdit,
  ariaLabel,
  emptyText,
  as = "p",
  className,
  multiline = false,
  required = false,
  minLength,
  maxLength,
}: InlineEditableProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) (multiline ? textareaRef.current : inputRef.current)?.focus();
  }, [editing, multiline]);

  if (!canEdit) {
    if (!value) return emptyText ? <p className="muted">{emptyText}</p> : null;
    const Tag = as;
    return <Tag className={className}>{value}</Tag>;
  }

  const startEdit = () => {
    setDraft(value);
    setError(null);
    setEditing(true);
  };

  const cancel = () => {
    setDraft(value);
    setError(null);
    setEditing(false);
  };

  const commit = async () => {
    const trimmed = draft.trim();
    if (required && !trimmed) {
      setError("Ce champ ne peut pas être vide.");
      return;
    }
    if (minLength && trimmed.length < minLength) {
      setError(`${minLength} caractères minimum.`);
      return;
    }
    if (trimmed === value.trim()) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave(trimmed);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    const Tag = as;
    return (
      <span className="inline-editable-display">
        {value ? (
          <Tag className={className} style={{ margin: 0 }}>
            {value}
          </Tag>
        ) : (
          <span className="inline-editable-empty">{emptyText}</span>
        )}
        <button type="button" className="inline-editable-trigger" onClick={startEdit} aria-label={`Modifier ${ariaLabel}`}>
          <Pencil size={14} />
        </button>
      </span>
    );
  }

  return (
    <div className="inline-editable-editing">
      <div className="inline-editable-form">
        {multiline ? (
          <textarea
            ref={textareaRef}
            value={draft}
            maxLength={maxLength}
            aria-label={ariaLabel}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Escape" && cancel()}
          />
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={draft}
            maxLength={maxLength}
            aria-label={ariaLabel}
            disabled={saving}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter") {
                e.preventDefault();
                commit();
              }
            }}
          />
        )}
        <button
          type="button"
          className="inline-editable-btn"
          onMouseDown={(e) => e.preventDefault()}
          onClick={commit}
          disabled={saving}
          aria-label="Enregistrer"
        >
          <Check size={14} />
        </button>
        <button
          type="button"
          className="inline-editable-btn cancel"
          onMouseDown={(e) => e.preventDefault()}
          onClick={cancel}
          disabled={saving}
          aria-label="Annuler"
        >
          <X size={14} />
        </button>
      </div>
      {error && (
        <p className="alert alert-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
