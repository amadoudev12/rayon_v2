import { useEffect, useMemo, useState } from "react";
import { Link } from "@/lib/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";
import { sendJson } from "@/lib/mutation";
import { downloadCsv } from "@/lib/csv";
import { formatNumber } from "@/lib/format";
import { INVENTORY_STATUS, type InventorySummary } from "./InventoryList";

type Line = {
  id: number;
  produitNom: string;
  produitReference: string | null;
  quantiteTheorique: number;
  quantiteComptee: number | null;
  coutUnitaire: string;
  version: number;
};
type Inventory = InventorySummary & { lignes: Line[]; canValidate?: boolean; canCancel?: boolean };

const PAGE_SIZE = 50;

/**
 * Comptage d'un inventaire : recherche et pagination dans les lignes, saisie
 * ligne par ligne (version optimiste contrôlée par le serveur), export CSV,
 * validation et annulation.
 */
export function InventoryDetail({ id }: { id: number }) {
  const { push } = useToast();
  const [inventory, setInventory] = useState<Inventory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [onlyUncounted, setOnlyUncounted] = useState(false);
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<"validate" | "cancel" | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    apiFetch(`/api/inventories/${id}`)
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) setError(body?.message ?? "Inventaire introuvable.");
        else setInventory(body.data);
      })
      .catch(() => !cancelled && setError("Chargement impossible."));
    return () => {
      cancelled = true;
    };
  }, [id, version]);

  const filtered = useMemo(() => {
    if (!inventory) return [];
    const term = search.trim().toLocaleLowerCase("fr");
    return inventory.lignes.filter(
      (line) =>
        (!onlyUncounted || line.quantiteComptee === null) &&
        (!term || line.produitNom.toLocaleLowerCase("fr").includes(term) || (line.produitReference ?? "").toLocaleLowerCase("fr").includes(term)),
    );
  }, [inventory, search, onlyUncounted]);

  if (error && !inventory) return <Alert>{error}</Alert>;
  if (!inventory) return <p className="text-sm text-slate-500">Chargement…</p>;

  const counted = inventory.lignes.filter((line) => line.quantiteComptee !== null).length;
  const editable = inventory.statut === "IN_PROGRESS";
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const status = INVENTORY_STATUS[inventory.statut];

  async function count(line: Line, raw: string) {
    if (raw === "" || Number(raw) === line.quantiteComptee) return;
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 0) return setError(`Quantité invalide pour « ${line.produitNom} ».`);
    const result = await sendJson<Line>(`/api/inventories/${id}/lines/${line.id}/count`, { quantiteComptee: value, version: line.version }, { method: "PUT" });
    if (!result.ok) {
      setError(result.message);
      return setVersion((current) => current + 1); // relit la ligne modifiée par un autre utilisateur
    }
    setError(null);
    setInventory((current) => current && { ...current, lignes: current.lignes.map((item) => (item.id === line.id ? { ...item, ...result.data } : item)) });
  }

  async function validate() {
    setBusy(true);
    const result = await sendJson(`/api/inventories/${id}/validate`, {});
    setBusy(false);
    if (!result.ok) return setError(result.message);
    push("Inventaire validé : le stock a été corrigé", "success");
    setVersion((current) => current + 1);
  }

  /** Renvoie le message d'erreur à afficher dans la fenêtre du motif. */
  async function cancelInventory(reason: string) {
    const result = await sendJson(`/api/inventories/${id}/cancel`, { motif: reason });
    if (!result.ok) return result.message;
    push("Inventaire annulé : le stock n'a pas été modifié", "success");
    setVersion((current) => current + 1);
  }

  function exportCsv() {
    if (!inventory) return;
    downloadCsv(
      `${inventory.reference}.csv`,
      ["Produit", "Référence", "Théorique", "Compté", "Écart", "Coût unitaire", "Valeur écart"],
      inventory.lignes.map((line) => {
        const delta = line.quantiteComptee === null ? null : line.quantiteComptee - line.quantiteTheorique;
        // Calcul en centimes entiers : aucun arrondi de nombre flottant (0,10 × 3 = 0,30).
        const costCents = Math.round(Number(line.coutUnitaire) * 100);
        const deltaValue = delta === null ? null : ((costCents * delta) / 100).toFixed(2).replace(".", ",");
        return [line.produitNom, line.produitReference, line.quantiteTheorique, line.quantiteComptee, delta, line.coutUnitaire.replace(".", ","), deltaValue];
      }),
    );
  }

  return (
    <div className="space-y-4">
      {error && <Alert>{error}</Alert>}
      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">
              {inventory.reference} · {inventory.libelle}
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              {inventory.boutique.nom} · {formatNumber(counted)} / {formatNumber(inventory.lignes.length)} produits comptés
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge dot tone={status.tone}>
              {status.label}
            </Badge>
            <Button variant="secondary" size="sm" onClick={exportCsv}>
              Exporter CSV
            </Button>
            {editable && inventory.canCancel && (
              <Button variant="secondary" size="sm" disabled={busy} onClick={() => setConfirm("cancel")}>
                Annuler
              </Button>
            )}
            {editable && inventory.canValidate && (
              <Button size="sm" disabled={busy || counted !== inventory.lignes.length} onClick={() => setConfirm("validate")}>
                Valider l&apos;inventaire
              </Button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            className={`${inputClass} max-w-xs`}
            placeholder="Rechercher un produit ou une référence…"
            aria-label="Rechercher dans l'inventaire"
          />
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={onlyUncounted}
              onChange={(event) => {
                setOnlyUncounted(event.target.checked);
                setPage(1);
              }}
            />
            Non comptés seulement
          </label>
        </div>

        <div className="scrollbar-thin mt-4 overflow-x-auto rounded-lg border border-slate-200/80">
          <table className="w-full min-w-md text-left text-sm">
            <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs font-medium text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Produit</th>
                <th className="px-3 py-2 text-right font-medium">Théorique</th>
                <th className="px-3 py-2 font-medium">Compté</th>
                <th className="px-3 py-2 text-right font-medium">Écart</th>
                <th className="px-3 py-2 text-right font-medium">Valeur de l&apos;écart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visible.map((line) => {
                const delta = line.quantiteComptee === null ? null : line.quantiteComptee - line.quantiteTheorique;
                return (
                  <tr key={line.id}>
                    <td className="px-3 py-2 text-slate-900">
                      {line.produitNom}
                      {line.produitReference && <span className="block text-xs text-slate-500">{line.produitReference}</span>}
                    </td>
                    <td className="tabular px-3 py-2 text-right text-slate-700">{formatNumber(line.quantiteTheorique)}</td>
                    <td className="px-3 py-2">
                      <input
                        key={`${line.id}-${line.version}`}
                        aria-label={`Quantité comptée pour ${line.produitNom}`}
                        type="number"
                        min={0}
                        step={1}
                        className={`${inputClass} tabular w-24`}
                        defaultValue={line.quantiteComptee ?? ""}
                        disabled={!editable}
                        onBlur={(event) => void count(line, event.target.value)}
                        onKeyDown={(event) => event.key === "Enter" && (event.target as HTMLInputElement).blur()}
                      />
                    </td>
                    <td className={`tabular px-3 py-2 text-right ${delta === null ? "text-slate-400" : delta < 0 ? "text-red-600" : delta > 0 ? "text-emerald-700" : "text-slate-700"}`}>
                      {delta === null ? "Non compté" : delta > 0 ? `+${delta}` : delta}
                    </td>
                    <td className="tabular px-3 py-2 text-right text-slate-700">
                      {delta === null ? "—" : (delta * Number(line.coutUnitaire)).toLocaleString("fr-FR", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
            <span>
              {formatNumber(filtered.length)} ligne(s) · page {page} / {pages}
            </span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>
                Précédent
              </Button>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>
                Suivant
              </Button>
            </div>
          </div>
        )}
      </Card>
      <p className="text-sm">
        <Link href="/stock/inventaires" className="font-medium text-brand-700 hover:underline">
          ← Tous les inventaires
        </Link>
      </p>

      <ConfirmDialog
        open={confirm === "validate"}
        onClose={() => setConfirm(null)}
        onConfirm={validate}
        title="Valider cet inventaire ?"
        description="Le stock de chaque produit sera corrigé selon le comptage, en tenant compte des ventes et achats faits depuis. Chaque correction est tracée."
        confirmLabel="Valider"
      />
      <ReasonDialog
        open={confirm === "cancel"}
        onClose={() => setConfirm(null)}
        onConfirm={cancelInventory}
        title="Annuler cet inventaire ?"
        description="Le comptage sera abandonné ; le stock ne sera pas modifié."
        confirmLabel="Annuler l'inventaire"
        placeholder="Ex. : comptage interrompu, erreur de sélection…"
        danger
      />
    </div>
  );
}
