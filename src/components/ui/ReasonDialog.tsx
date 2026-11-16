import { useState } from "react";
import { Modal, ModalFooter } from "./Modal";
import { Button } from "./Button";
import { FormField, inputClass } from "./FormField";

/**
 * Confirmation d'une action qui exige un motif écrit (annulation d'une perte,
 * d'un inventaire…). Le motif est conservé dans l'historique et l'audit.
 */
export function ReasonDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirmer",
  placeholder,
  danger = false,
}: {
  open: boolean;
  onClose: () => void;
  /** Renvoie un message d'erreur pour garder la fenêtre ouverte, sinon rien. */
  onConfirm: (reason: string) => Promise<string | void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  placeholder?: string;
  danger?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function close() {
    setReason("");
    setError(null);
    onClose();
  }

  async function confirm() {
    const trimmed = reason.trim();
    if (trimmed.length < 3) return setError("Indiquez le motif (3 caractères au moins).");
    setLoading(true);
    const failure = await onConfirm(trimmed);
    setLoading(false);
    if (failure) return setError(failure);
    close();
  }

  return (
    <Modal open={open} onClose={close} title={title} description={description} size="sm">
      <FormField label="Motif" htmlFor="reason" error={error ?? undefined}>
        <textarea
          id="reason"
          rows={3}
          autoFocus
          maxLength={500}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          className={inputClass}
          placeholder={placeholder}
        />
      </FormField>
      <ModalFooter className="mt-4">
        <Button variant="secondary" onClick={close} disabled={loading}>
          Retour
        </Button>
        <Button variant={danger ? "danger" : "primary"} onClick={() => void confirm()} loading={loading}>
          {confirmLabel}
        </Button>
      </ModalFooter>
    </Modal>
  );
}
