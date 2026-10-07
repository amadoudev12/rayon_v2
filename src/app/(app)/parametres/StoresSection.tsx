import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { FormField, inputClass } from "@/components/ui/FormField";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

type Store = { id: number; nom: string; adresse: string | null; telephone: string | null; parDefaut: boolean };

export function StoresSection({ stores, canManage }: { stores: Store[]; canManage: boolean }) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const response = await apiFetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: name, adresse: address, telephone: phone }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        push(body?.message ?? "Impossible de créer la boutique", "error");
        return;
      }
      push("Boutique créée", "success");
      setName("");
      setAddress("");
      setPhone("");
      setOpen(false);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      {stores.length === 0 ? (
        <EmptyState compact icon="store" title="Aucune boutique" />
      ) : (
        <ul className="divide-y divide-slate-100">
          {stores.map((store) => (
            <li key={store.id} className="flex items-center gap-3 px-5 py-3.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
                <Icon name="store" className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                  <span className="min-w-0 truncate">{store.nom}</span>
                  {store.parDefaut && <Badge tone="brand">Principale</Badge>}
                </p>
                <p className="truncate text-xs text-slate-500">{store.adresse ?? "Adresse non renseignée"}</p>
              </div>
              {store.telephone && <span className="tabular hidden text-xs text-slate-500 sm:block">{store.telephone}</span>}
            </li>
          ))}
        </ul>
      )}

      {canManage && (
        <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            <Icon name="plus" className="h-4 w-4" />
            Ajouter une boutique
          </Button>
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Nouvelle boutique" size="sm">
        <div className="space-y-4">
          <FormField label="Nom" htmlFor="storeName">
            <input id="storeName" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Adresse (optionnel)" htmlFor="storeAddress">
            <input id="storeAddress" value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
          </FormField>
          <FormField label="Téléphone (optionnel)" htmlFor="storePhone">
            <input id="storePhone" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
          </FormField>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} loading={submitting} disabled={!name.trim()}>
              Créer
            </Button>
          </ModalFooter>
        </div>
      </Modal>
    </div>
  );
}
