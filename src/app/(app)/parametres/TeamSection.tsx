import { useState } from "react";
import { useRouter } from "@/lib/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMemberSchema,
  ASSIGNABLE_ROLES,
  type CreateMemberFormData,
  type CreateMemberFormInput,
} from "@/lib/validations/member";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import type { Role } from "@/generated/prisma/enums";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { initials } from "@/lib/format";
import { userContact } from "@/lib/auth/identifier";
import { apiFetch } from "@/lib/api";

type Member = {
  id: number;
  role: Role;
  utilisateur: { id: number; prenom: string; nom: string; email: string | null; telephone: string | null };
  boutique: { id: number; nom: string } | null;
};

export function TeamSection({
  members,
  stores,
  currentUserId,
  ownerRole,
}: {
  members: Member[];
  stores: { id: number; nom: string }[];
  currentUserId: number;
  ownerRole: Role;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [removing, setRemoving] = useState<Member | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateMemberFormInput, unknown, CreateMemberFormData>({ resolver: zodResolver(createMemberSchema) });

  async function onSubmit(data: CreateMemberFormData) {
    const response = await apiFetch("/api/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Impossible d'ajouter ce membre", "error");
      return;
    }
    push("Membre ajouté. Communiquez-lui son mot de passe.", "success");
    reset();
    setOpen(false);
    router.refresh();
  }

  async function handleRemove() {
    if (!removing) return;
    const response = await apiFetch(`/api/members/${removing.id}`, { method: "DELETE" });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      push(body?.message ?? "Suppression impossible", "error");
      return;
    }
    push("Membre retiré", "success");
    router.refresh();
  }

  return (
    <div>
      <ul className="divide-y divide-slate-100">
        {members.map((member) => (
          <li key={member.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5 sm:flex-nowrap">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200/70">
              {initials(member.utilisateur.prenom, member.utilisateur.nom)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                <span className="min-w-0 truncate">
                  {member.utilisateur.prenom} {member.utilisateur.nom}
                </span>
                {member.utilisateur.id === currentUserId && <Badge>Vous</Badge>}
              </p>
              <p className="truncate text-xs text-slate-500">{userContact(member.utilisateur)}</p>
            </div>
            <div className="flex items-center gap-2 pl-12 sm:pl-0">
              {member.boutique && (
                <span className="hidden items-center gap-1 text-xs text-slate-500 md:inline-flex">
                  <Icon name="store" className="h-3.5 w-3.5 text-slate-400" />
                  {member.boutique.nom}
                </span>
              )}
              <Badge tone="brand">{ROLE_LABELS[member.role]}</Badge>
              {member.role !== ownerRole && member.utilisateur.id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => setRemoving(member)}
                  aria-label="Retirer"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 hover:bg-red-50 hover:text-red-600 focus-visible:ring-red-300"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3">
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <Icon name="plus" className="h-4 w-4" />
          Ajouter un membre
        </Button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Ajouter un membre de l'équipe" size="lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Alert tone="warning">
            Aucun message n&apos;est envoyé automatiquement : communiquez ce mot de passe temporaire vous-même.
          </Alert>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Prénom" htmlFor="memberFirstName" error={errors.prenom?.message}>
              <input id="memberFirstName" className={inputClass} {...register("prenom")} />
            </FormField>
            <FormField label="Nom" htmlFor="memberLastName" error={errors.nom?.message}>
              <input id="memberLastName" className={inputClass} {...register("nom")} />
            </FormField>
          </div>
          <FormField
            label="Email ou téléphone"
            htmlFor="memberIdentifier"
            error={errors.identifiant?.message}
            hint="Son identifiant de connexion. Pour un numéro, indiquez l'indicatif : +221 77 123 45 67."
          >
            <input id="memberIdentifier" type="text" autoComplete="off" className={inputClass} {...register("identifiant")} />
          </FormField>
          <FormField label="Mot de passe temporaire" htmlFor="memberPassword" error={errors.motDePasse?.message}>
            <input id="memberPassword" type="text" className={inputClass} {...register("motDePasse")} />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Rôle" htmlFor="memberRole" error={errors.role?.message}>
              <select id="memberRole" className={selectClass} {...register("role")}>
                {ASSIGNABLE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Boutique (optionnel)" htmlFor="memberStore">
              <select id="memberStore" className={selectClass} {...register("boutiqueId")}>
                <option value="">Toutes les boutiques</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.nom}
                  </option>
                ))}
              </select>
            </FormField>
          </div>
          <ModalFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" loading={isSubmitting}>
              Ajouter
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(removing)}
        onClose={() => setRemoving(null)}
        onConfirm={handleRemove}
        title="Retirer ce membre ?"
        description={`${removing?.utilisateur.prenom} ${removing?.utilisateur.nom} perdra l'accès à votre organisation.`}
        confirmLabel="Retirer"
        danger
      />
    </div>
  );
}
