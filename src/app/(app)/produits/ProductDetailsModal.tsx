import { useEffect, useState } from "react";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { MOVEMENT_LABELS } from "@/lib/labels";
import type { StockMovementType } from "@/generated/prisma/enums";
import type { ProductRow } from "./ProductFormModal";
import { Alert } from "@/components/ui/Alert";
import { apiFetch } from "@/lib/api";

/** Détails complémentaires chargés depuis GET /api/products/[id]. */
type ProductDetails = {
  creeLe: string;
  modifieLe: string;
  stocks: { quantite: number; boutique: { id: number; nom: string } }[];
  mouvementsStock: {
    id: number;
    type: StockMovementType;
    variationQuantite: number;
    note: string | null;
    creeLe: string;
    boutique: { nom: string };
    utilisateur: { prenom: string; nom: string };
  }[];
  ventes: { nombre: number; quantite: number; montant: string | number };
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-900">{children}</dd>
    </div>
  );
}

export function ProductDetailsModal({
  product,
  categoryName,
  currency,
  canManage,
  onClose,
  onEdit,
  onAdjust,
}: {
  product: ProductRow | null;
  categoryName: string | null;
  currency: string;
  canManage: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAdjust: () => void;
}) {
  const productId = product?.id;
  // Le résultat est rattaché à l'id chargé : à l'ouverture d'un autre produit,
  // l'ancien résultat est ignoré sans avoir à réinitialiser l'état.
  const [result, setResult] = useState<{ id: number; details?: ProductDetails; error?: string } | null>(null);
  const current = result?.id === productId ? result : null;
  const details = current?.details ?? null;
  const error = current?.error ?? null;

  useEffect(() => {
    if (!productId) return;
    let cancelled = false;
    apiFetch(`/api/products/${productId}`)
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (cancelled) return;
        if (!response.ok) setResult({ id: productId, error: body?.message ?? "Impossible de charger le produit" });
        else setResult({ id: productId, details: body.data });
      })
      .catch(() => !cancelled && setResult({ id: productId, error: "Impossible de charger le produit" }));
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (!product) return null;

  const prixAchat = Number(product.prixAchat);
  const prixVente = Number(product.prixVente);
  const margeUnitaire = prixVente - prixAchat;
  const tauxMarge = prixVente > 0 ? (margeUnitaire / prixVente) * 100 : 0;
  const stock = product.quantiteStock ?? 0;
  const stockTone = stock <= 0 ? "danger" : stock <= product.seuilAlerte ? "warning" : "success";

  return (
    <Modal open onClose={onClose} title={product.nom} description={categoryName ?? "Sans catégorie"} size="lg">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge dot tone={product.actif ? "success" : "neutral"}>{product.actif ? "Actif" : "Archivé"}</Badge>
          <Badge dot tone={stockTone}>
            {stock <= 0 ? "Rupture" : `${formatNumber(stock)} ${product.unite} en stock`}
          </Badge>
        </div>

        <dl className="tabular grid grid-cols-2 gap-4 rounded-lg bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70 sm:grid-cols-4">
          <Field label="Prix d'achat">{formatMoney(prixAchat, currency)}</Field>
          <Field label="Prix de vente">{formatMoney(prixVente, currency)}</Field>
          <Field label="Marge unitaire">
            <span className={margeUnitaire < 0 ? "text-red-600" : "text-emerald-600"}>
              {formatMoney(margeUnitaire, currency)}
            </span>
            <span className="ml-1 text-xs text-slate-500">
              ({tauxMarge.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %)
            </span>
          </Field>
          <Field label="Seuil d'alerte">
            {product.seuilAlerte} {product.unite}
          </Field>
        </dl>

        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Field label="Unité">{product.unite}</Field>
        </dl>

        {error && <Alert>{error}</Alert>}

        {!details && !error && (
          <div className="space-y-3 border-t border-slate-100 pt-4" aria-busy="true">
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
              <Skeleton className="h-9" />
            </div>
            <Skeleton className="h-24" />
          </div>
        )}

        {details && (
          <>
            <dl className="tabular grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
              <Field label="Ventes (terminées)">{formatNumber(details.ventes.nombre)}</Field>
              <Field label="Quantité vendue">
                {formatNumber(details.ventes.quantite)} {product.unite}
              </Field>
              <Field label="Montant vendu">{formatMoney(Number(details.ventes.montant), currency)}</Field>
            </dl>

            {details.stocks.length > 1 && (
              <div>
                <h3 className="mb-2 text-[13px] font-semibold text-slate-900">Stock par boutique</h3>
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80">
                  {details.stocks.map((row) => (
                    <li key={row.boutique.id} className="flex justify-between px-3 py-2 text-sm">
                      <span className="text-slate-700">{row.boutique.nom}</span>
                      <span className="font-medium text-slate-900">
                        {formatNumber(row.quantite)} {product.unite}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="mb-2 text-[13px] font-semibold text-slate-900">Derniers mouvements de stock</h3>
              {details.mouvementsStock.length === 0 ? (
                <p className="text-sm text-slate-400">Aucun mouvement.</p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200/80">
                  {details.mouvementsStock.map((movement) => {
                    const meta = MOVEMENT_LABELS[movement.type];
                    return (
                      <li key={movement.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge dot tone={meta.tone}>{meta.label}</Badge>
                            <span className="truncate text-xs text-slate-500">
                              {formatDateTime(movement.creeLe)} · {movement.utilisateur.prenom} {movement.utilisateur.nom}
                            </span>
                          </div>
                          {movement.note && <p className="mt-0.5 truncate text-xs text-slate-400">{movement.note}</p>}
                        </div>
                        <span
                          className={`shrink-0 font-medium ${movement.variationQuantite < 0 ? "text-red-600" : "text-emerald-600"}`}
                        >
                          {movement.variationQuantite > 0 ? "+" : ""}
                          {movement.variationQuantite}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <p className="text-xs text-slate-400">
              Créé le {formatDateTime(details.creeLe)} · modifié le {formatDateTime(details.modifieLe)}
            </p>
          </>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Fermer
          </Button>
          {canManage && (
            <>
              <Button type="button" variant="secondary" onClick={onAdjust}>
                Ajuster le stock
              </Button>
              <Button type="button" onClick={onEdit}>
                <Icon name="edit" className="h-4 w-4" />
                Modifier
              </Button>
            </>
          )}
        </ModalFooter>
      </div>
    </Modal>
  );
}
