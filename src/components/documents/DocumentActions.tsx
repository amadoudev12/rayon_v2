import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import {
  canShareFiles,
  downloadDocumentPdf,
  printDocument,
  shareDocumentPdf,
  whatsappLink,
  type CommercialDocument,
} from "@/lib/commercial-document";

/**
 * Boutons « Imprimer », « Télécharger le PDF » et « Envoyer » d'un document
 * commercial. « Envoyer » ouvre le menu de partage de l'appareil (le PDF est
 * joint) ; à défaut, WhatsApp avec un message si le téléphone est connu.
 */
export function DocumentActions({
  document: doc,
  printLabel = "Imprimer",
  downloadLabel = "Télécharger le PDF",
  phone,
  shareMessage,
}: {
  document: CommercialDocument;
  printLabel?: string;
  downloadLabel?: string;
  phone?: string | null;
  shareMessage?: string;
}) {
  const { push } = useToast();
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const whatsapp = phone && shareMessage ? whatsappLink(phone, shareMessage) : null;
  const shareable = canShareFiles();

  async function run(action: "download" | "share") {
    setBusy(action);
    try {
      if (action === "download") await downloadDocumentPdf(doc);
      else if (!(await shareDocumentPdf(doc))) {
        if (whatsapp) window.open(whatsapp, "_blank", "noopener");
        else push("Le partage de fichiers n'est pas disponible sur cet appareil : téléchargez le PDF.", "error");
      }
    } catch {
      push("Impossible de générer le document PDF", "error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => printDocument(doc)}>
        <Icon name="printer" className="h-4 w-4" />
        {printLabel}
      </Button>
      <Button type="button" variant="secondary" loading={busy === "download"} onClick={() => run("download")}>
        <Icon name="download" className="h-4 w-4" />
        {downloadLabel}
      </Button>
      {shareable ? (
        <Button type="button" variant="secondary" loading={busy === "share"} onClick={() => run("share")}>
          <Icon name="share" className="h-4 w-4" />
          Envoyer
        </Button>
      ) : (
        whatsapp && (
          <a
            href={whatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-sm font-medium text-slate-700 shadow-xs transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900"
          >
            <Icon name="share" className="h-4 w-4" />
            WhatsApp
          </a>
        )
      )}
    </>
  );
}
