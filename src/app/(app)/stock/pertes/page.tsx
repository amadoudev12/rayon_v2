import { useState } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useRouter, useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ReasonDialog } from "@/components/ui/ReasonDialog";
import { LinkButton } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { TableContainer, Table, Thead, Th, Tr, Td } from "@/components/ui/Table";
import { useToast } from "@/components/ui/ToastProvider";
import { sendJson } from "@/lib/mutation";
import { formatDateTime, formatMoney } from "@/lib/format";
import { LOSS_STATUS } from "@/lib/labels";
import { LossForm } from "./LossForm";

export type LossReasonOption = { value: string; label: string };

type Loss = {
  id: number;
  reference: string;
  quantite: number;
  motifLibelle: string;
  description: string | null;
  statut: "ACTIVE" | "CANCELLED";
  valeur: string;
  creeLe: string;
  annuleLe: string | null;
  motifAnnulation: string | null;
  canCancel: boolean;
  absorbeeParInventaire: boolean;
  produit: { nom: string; unite: string };
  declarePar: { prenom: string; nom: string };
  annulePar: { prenom: string; nom: string } | null;
};

type LossesPageData = {
  store: { id: number; nom: string };
  currency: string;
  losses: Loss[];
  reasons: LossReasonOption[];
  canCreate: boolean;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<LossesPageData>("/stock/pertes", request);
}

/** Pertes et casses de la boutique active : déclaration et historique annulable. */
export default function LossesPage() {
  const params = useSearchParamsRecord();
  const router = useRouter();
  const { push } = useToast();
  const { store, currency, losses, reasons, canCreate, page, totalPages, total } = useLoaderData<LossesPageData>();
  const [cancelling, setCancelling] = useState<Loss | null>(null);

  async function cancel(reason: string) {
    if (!cancelling) return;
    const result = await sendJson(`/api/losses/${cancelling.id}/cancel`, { motif: reason });
    if (!result.ok) return result.message;
    push(`Perte ${cancelling.reference} annulée : stock restitué`, "success");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pertes et casses"
        description={`Boutique ${store.nom}. Chaque déclaration retire le stock et reste annulable tant qu'aucun inventaire ne l'a prise en compte.`}
        action={
          <LinkButton href="/stock" variant="secondary">
            <Icon name="arrowLeft" className="h-4 w-4" />
            Retour au stock
          </LinkButton>
        }
      />

      {canCreate && <LossForm reasons={reasons} onDeclared={() => router.refresh()} />}

      <Card>
        <h2 className="border-b border-slate-100 px-5 py-3 text-sm font-semibold text-slate-900">Historique</h2>
        {losses.length === 0 ? (
          <EmptyState icon="alert" title="Aucune perte déclarée" description="Les pertes, casses et produits périmés apparaîtront ici." />
        ) : (
          <>
            <TableContainer>
              <Table>
                <Thead>
                  <tr>
                    <Th>Référence</Th>
                    <Th>Date</Th>
                    <Th>Produit</Th>
                    <Th className="text-right">Quantité</Th>
                    <Th className="text-right">Valeur</Th>
                    <Th>Motif</Th>
                    <Th>Statut</Th>
                    <Th>
                      <span className="sr-only">Actions</span>
                    </Th>
                  </tr>
                </Thead>
                <tbody>
                  {losses.map((loss) => (
                    <Tr key={loss.id}>
                      <Td className="font-medium text-slate-900">{loss.reference}</Td>
                      <Td className="text-slate-600">
                        {formatDateTime(loss.creeLe)}
                        <span className="block text-xs text-slate-400">
                          {loss.declarePar.prenom} {loss.declarePar.nom}
                        </span>
                      </Td>
                      <Td>{loss.produit.nom}</Td>
                      <Td className="tabular text-right">
                        {loss.quantite} {loss.produit.unite}
                      </Td>
                      <Td className="tabular text-right">{formatMoney(Number(loss.valeur), currency)}</Td>
                      <Td>
                        {loss.motifLibelle}
                        {loss.description && <span className="block text-xs text-slate-500">{loss.description}</span>}
                      </Td>
                      <Td>
                        <Badge dot tone={LOSS_STATUS[loss.statut]?.tone ?? "neutral"}>
                          {LOSS_STATUS[loss.statut]?.label ?? loss.statut}
                        </Badge>
                        {loss.statut === "CANCELLED" && loss.motifAnnulation && (
                          <span className="mt-1 block text-xs text-slate-500">
                            {loss.motifAnnulation}
                            {loss.annulePar ? ` — ${loss.annulePar.prenom} ${loss.annulePar.nom}` : ""}
                          </span>
                        )}
                        {loss.absorbeeParInventaire && <span className="mt-1 block text-xs text-slate-500">Prise en compte par un inventaire</span>}
                      </Td>
                      <Td className="text-right">
                        {loss.canCancel && (
                          <button type="button" onClick={() => setCancelling(loss)} className="text-sm font-medium text-brand-700 hover:underline">
                            Annuler
                          </button>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </TableContainer>
            <Pagination basePath="/stock/pertes" searchParams={params} page={page} totalPages={totalPages} total={total} />
          </>
        )}
      </Card>

      <ReasonDialog
        open={Boolean(cancelling)}
        onClose={() => setCancelling(null)}
        onConfirm={cancel}
        title={`Annuler la perte ${cancelling?.reference ?? ""} ?`}
        description={`Le stock de « ${cancelling?.produit.nom ?? ""} » sera recrédité de ${cancelling?.quantite ?? 0}. L'annulation est tracée dans l'historique.`}
        confirmLabel="Annuler la perte"
        placeholder="Ex. : produit retrouvé, erreur de saisie…"
        danger
      />
    </div>
  );
}
