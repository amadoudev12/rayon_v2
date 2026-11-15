import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

export function OrganizationForm({
  organization,
  canEdit,
}: {
  organization: { nom: string; devise: string; fuseauHoraire: string; remiseMaxVendeurPct: number; remiseMaxGerantPct: number };
  canEdit: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState(organization.nom);
  const [currency, setCurrency] = useState(organization.devise);
  const [timeZone, setTimeZone] = useState(organization.fuseauHoraire);
  const [sellerCap, setSellerCap] = useState(String(organization.remiseMaxVendeurPct));
  const [managerCap, setManagerCap] = useState(String(organization.remiseMaxGerantPct));
  const [submitting, setSubmitting] = useState(false);
  const capProblem =
    [sellerCap, managerCap].some((value) => !/^d+$/.test(value) || Number(value) > 100)
      ? "Indiquez un pourcentage entier entre 0 et 100."
      : Number(managerCap) < Number(sellerCap)
        ? "Le plafond d'un gérant ne peut pas être inférieur à celui d'un vendeur."
        : null;

  async function submit() {
    setSubmitting(true);
    try {
      const response = await apiFetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: name,
          devise: currency,
          fuseauHoraire: timeZone,
          remiseMaxVendeurPct: Number(sellerCap),
          remiseMaxGerantPct: Number(managerCap),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        push(body?.message ?? "Mise à jour impossible", "error");
        return;
      }
      push("Organisation mise à jour", "success");
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
        <FormField label="Nom de l'organisation" htmlFor="orgName">
          <input
            id="orgName"
            value={name}
            disabled={!canEdit}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </FormField>
        <FormField label="Devise (code ISO, ex : XOF)" htmlFor="orgCurrency">
          <input
            id="orgCurrency"
            value={currency}
            disabled={!canEdit}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            maxLength={3}
            className={`${inputClass} font-mono uppercase`}
          />
        </FormField>
        <FormField label="Fuseau horaire (IANA)" htmlFor="orgTimeZone">
          <input id="orgTimeZone" value={timeZone} disabled={!canEdit} onChange={(e) => setTimeZone(e.target.value)} placeholder="Africa/Dakar" className={inputClass} />
        </FormField>
      </div>
      <div className="border-t border-slate-100 p-5">
        <p className="text-sm font-medium text-slate-900">Remises autorisées</p>
        <p className="mt-0.5 text-xs text-slate-500">
          Remise maximale, prix négociés compris, en % du prix catalogue. Le propriétaire et les administrateurs n'ont pas de limite ; eux seuls peuvent vendre sous le prix d'achat.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Vendeur et gestionnaire de stock (%)" htmlFor="sellerCap" error={capProblem ?? undefined}>
            <input id="sellerCap" inputMode="numeric" value={sellerCap} disabled={!canEdit} onChange={(e) => setSellerCap(e.target.value)} className={`${inputClass} tabular`} />
          </FormField>
          <FormField label="Gérant (%)" htmlFor="managerCap">
            <input id="managerCap" inputMode="numeric" value={managerCap} disabled={!canEdit} onChange={(e) => setManagerCap(e.target.value)} className={`${inputClass} tabular`} />
          </FormField>
        </div>
      </div>
      {canEdit && (
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <Button onClick={submit} loading={submitting} disabled={Boolean(capProblem)}>
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
