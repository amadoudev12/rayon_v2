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
  organization: { nom: string; devise: string };
  canEdit: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [name, setName] = useState(organization.nom);
  const [currency, setCurrency] = useState(organization.devise);
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      const response = await apiFetch("/api/organization", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: name, devise: currency }),
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
      </div>
      {canEdit && (
        <div className="flex justify-end border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <Button onClick={submit} loading={submitting}>
            Enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
