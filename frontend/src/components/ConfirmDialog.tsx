import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirmer",
  danger = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          {danger && <AlertTriangle size={20} color="var(--danger)" />}
          <h3 id="confirm-dialog-title" style={{ margin: 0 }}>
            {title}
          </h3>
        </div>
        <p className="muted" style={{ margin: 0 }}>
          {message}
        </p>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Annuler
          </button>
          <button type="button" className={danger ? "btn-danger" : "btn-primary"} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
