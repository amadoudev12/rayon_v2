import { useRef, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";
import {
  IMPORT_COLUMNS,
  ImportFileError,
  downloadImportTemplate,
  parseProductFile,
  type ParsedImport,
} from "@/lib/product-import";

type ImportResult = {
  crees: number;
  categoriesCreees: number;
  ignores: { ligne: number; nom: string; raison: string }[];
};

const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count > 1 ? pluralForm : singular}`;

export function ImportProductsModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [fileError, setFileError] = useState("");
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);

  function resetFile() {
    setFileName("");
    setParsed(null);
    setFileError("");
    setResult(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function close() {
    resetFile();
    onClose();
  }

  async function readFile(file: File | undefined) {
    if (!file) return;
    resetFile();
    setFileName(file.name);
    setReading(true);
    try {
      setParsed(await parseProductFile(file));
    } catch (error) {
      setFileError(error instanceof ImportFileError ? error.message : "Impossible de lire ce fichier.");
    } finally {
      setReading(false);
    }
  }

  async function downloadTemplate() {
    try {
      await downloadImportTemplate();
    } catch {
      push("Impossible de générer le modèle", "error");
    }
  }

  async function submit() {
    if (!parsed || parsed.rows.length === 0) return;
    setImporting(true);
    try {
      const response = await apiFetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lignes: parsed.rows }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        push(body?.message ?? "L'import a échoué, aucun produit n'a été créé", "error");
        return;
      }

      const data = body.data as ImportResult;
      if (data.crees > 0) onImported();
      // Rien à signaler : on ferme directement. Sinon le bilan reste affiché.
      if (data.ignores.length === 0 && parsed.errors.length === 0) {
        push(`${plural(data.crees, "produit importé", "produits importés")}`, "success");
        close();
        return;
      }
      setResult(data);
    } catch {
      push("Connexion au serveur impossible, aucun produit n'a été créé", "error");
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Importer des produits"
      description="Ajoutez plusieurs produits d'un coup à partir d'un fichier Excel."
      size="lg"
    >
      {result ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
            <Icon name="checkCircle" className="mt-0.5 h-4 w-4 shrink-0" />
            <p>
              <span className="font-semibold">{plural(result.crees, "produit créé", "produits créés")}</span>
              {result.categoriesCreees > 0 &&
                ` et ${plural(result.categoriesCreees, "nouvelle catégorie", "nouvelles catégories")}`}
              .
            </p>
          </div>

          {result.ignores.length > 0 && (
            <LineList
              title={`${plural(result.ignores.length, "ligne ignorée", "lignes ignorées")} pour éviter un doublon`}
              lines={result.ignores.map((ignore) => ({ ligne: ignore.ligne, nom: ignore.nom, detail: ignore.raison }))}
            />
          )}
          {parsed && parsed.errors.length > 0 && (
            <LineList
              title={`${plural(parsed.errors.length, "ligne non importée", "lignes non importées")} car à corriger`}
              lines={parsed.errors.map((error) => ({ ...error, detail: error.messages.join(" ") }))}
            />
          )}

          <ModalFooter>
            <Button type="button" onClick={close}>
              Fermer
            </Button>
          </ModalFooter>
        </div>
      ) : (
        <div className="space-y-4">
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="sr-only"
            onChange={(event) => readFile(event.target.files?.[0])}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(event) => event.preventDefault()}
            onDrop={(event) => {
              event.preventDefault();
              readFile(event.dataTransfer.files[0]);
            }}
            disabled={reading || importing}
            className="flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-50/60 px-4 py-6 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/60 disabled:cursor-default"
          >
            <Icon name="upload" className="h-5 w-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-800">
              {reading ? "Lecture du fichier…" : fileName || "Choisir un fichier Excel (.xlsx)"}
            </span>
            <span className="text-xs text-slate-500">
              {fileName ? "Cliquez pour choisir un autre fichier" : "ou déposez-le ici"}
            </span>
          </button>

          {fileError && (
            <div role="alert" className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <Icon name="alertCircle" className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{fileError}</p>
            </div>
          )}

          {parsed ? (
            <>
              <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
                <p className="text-slate-700">
                  <span className="font-semibold text-slate-900">{parsed.rows.length}</span>{" "}
                  {parsed.rows.length > 1 ? "produits prêts à importer" : "produit prêt à importer"}
                </p>
                {parsed.errors.length > 0 && (
                  <p className="font-medium text-red-600">{plural(parsed.errors.length, "ligne à corriger", "lignes à corriger")}</p>
                )}
              </div>

              {parsed.errors.length > 0 && (
                <LineList
                  title="Ces lignes ne seront pas importées. Corrigez-les dans le fichier puis rechargez-le, ou importez seulement les autres."
                  lines={parsed.errors.map((error) => ({ ...error, detail: error.messages.join(" ") }))}
                />
              )}

              {parsed.rows.length > 0 && (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500">
                      <tr>
                        <th className="px-3 py-2 font-medium">Nom</th>
                        <th className="px-3 py-2 text-right font-medium">Prix d'achat</th>
                        <th className="px-3 py-2 text-right font-medium">Prix de vente</th>
                        <th className="px-3 py-2 text-right font-medium">Stock</th>
                        <th className="px-3 py-2 font-medium">Catégorie</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parsed.rows.slice(0, 5).map((row) => (
                        <tr key={row.ligne}>
                          <td className="px-3 py-2 text-slate-900">{row.nom}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.prixAchat}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-600">{row.prixVente}</td>
                          <td className="px-3 py-2 text-right tabular-nums text-slate-600">
                            {row.quantiteInitiale ?? 0} {row.unite}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{row.categorie || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.rows.length > 5 && (
                    <p className="border-t border-slate-100 px-3 py-2 text-xs text-slate-500">
                      … et {plural(parsed.rows.length - 5, "autre produit", "autres produits")}
                    </p>
                  )}
                </div>
              )}

              <p className="text-xs text-slate-500">
                Le stock initial est ajouté à la boutique active. Les produits déjà présents dans le catalogue sont
                ignorés.
              </p>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-slate-900">Colonnes du fichier</p>
                <Button type="button" variant="secondary" size="sm" onClick={downloadTemplate}>
                  <Icon name="download" className="h-3.5 w-3.5" />
                  Télécharger le modèle
                </Button>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                La première ligne contient les titres, puis une ligne par produit. Les colonnes marquées d'un
                astérisque sont obligatoires.
              </p>
              <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2">
                {IMPORT_COLUMNS.map((column) => (
                  <div key={column.field} className="flex gap-2">
                    <dt className="shrink-0 font-medium text-slate-800">
                      {column.title}
                      {column.required && <span className="text-red-600"> *</span>}
                    </dt>
                    <dd className="text-slate-500">{column.hint}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={close}>
              Annuler
            </Button>
            <Button type="button" loading={importing} disabled={!parsed || parsed.rows.length === 0} onClick={submit}>
              {parsed && parsed.rows.length > 0
                ? `Importer ${plural(parsed.rows.length, "produit")}`
                : "Importer"}
            </Button>
          </ModalFooter>
        </div>
      )}
    </Modal>
  );
}

/** Liste défilante de lignes du fichier à signaler, avec leur numéro. */
function LineList({ title, lines }: { title: string; lines: { ligne: number; nom: string; detail: string }[] }) {
  return (
    <div className="rounded-xl border border-slate-200">
      <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{title}</p>
      <ul className="scrollbar-thin max-h-44 divide-y divide-slate-100 overflow-y-auto text-sm">
        {lines.map((line) => (
          <li key={line.ligne} className="px-3 py-2">
            <span className="font-medium text-slate-900">
              Ligne {line.ligne} · {line.nom}
            </span>
            <span className="block text-xs text-slate-500">{line.detail}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
