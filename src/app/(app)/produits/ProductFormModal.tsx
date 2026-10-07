import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, type ProductFormData, type ProductFormInput } from "@/lib/validations/product";
import { Modal, ModalFooter } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { FormField, inputClass, selectClass } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/ToastProvider";
import { apiFetch } from "@/lib/api";

type Category = { id: number; nom: string };

export type ProductRow = {
  id: number;
  nom: string;
  unite: string;
  categorieId: number | null;
  prixAchat: number | string;
  prixVente: number | string;
  seuilAlerte: number;
  actif: boolean;
  quantiteStock?: number;
};

/** Valeurs du formulaire : celles du produit en modification, sinon les valeurs par défaut. */
function toFormValues(product?: ProductRow | null): ProductFormInput {
  if (!product) {
    return {
      nom: "",
      unite: "unité",
      categorieId: null,
      prixAchat: undefined,
      prixVente: undefined,
      seuilAlerte: 5,
      quantiteInitiale: undefined,
      actif: true,
    };
  }
  return {
    nom: product.nom,
    unite: product.unite,
    categorieId: product.categorieId,
    prixAchat: Number(product.prixAchat),
    prixVente: Number(product.prixVente),
    seuilAlerte: product.seuilAlerte,
    actif: product.actif,
  };
}

export function ProductFormModal({
  open,
  onClose,
  onSaved,
  product,
  categories,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  product?: ProductRow | null;
  categories: Category[];
}) {
  const { push } = useToast();
  const [categoryList, setCategoryList] = useState(categories);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);
  const isEdit = Boolean(product);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormInput, unknown, ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: toFormValues(product),
  });

  // Le modal reste monté dans le tableau : `defaultValues` n'est lu qu'au
  // premier rendu. On recharge donc les valeurs à chaque ouverture, sinon le
  // formulaire de modification resterait vide.
  useEffect(() => {
    // `keepFieldsRef` : sans lui, `reset` oublie les champs déjà montés et,
    // avec le React Compiler (appels à `register` mémoïsés), ils ne sont jamais
    // réenregistrés : la saisie était ignorée et le champ jugé vide.
    if (open) reset(toFormValues(product), { keepFieldsRef: true });
  }, [open, product, reset]);

  async function addCategory() {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const response = await apiFetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nom: newCategoryName.trim() }),
      });
      const body = await response.json();
      if (!response.ok) {
        push(body?.message ?? "Impossible de créer la catégorie", "error");
        return;
      }
      setCategoryList((current) => [...current, body.data].sort((a, b) => a.nom.localeCompare(b.nom)));
      setValue("categorieId", body.data.id);
      setNewCategoryName("");
    } finally {
      setAddingCategory(false);
    }
  }

  async function onSubmit(data: ProductFormData) {
    const url = isEdit ? `/api/products/${product!.id}` : "/api/products";
    const response = await apiFetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const body = await response.json().catch(() => null);

    if (!response.ok) {
      push(body?.message ?? "Une erreur est survenue", "error");
      return;
    }

    push(isEdit ? "Produit mis à jour" : "Produit créé", "success");
    reset();
    onSaved();
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Modifier le produit" : "Nouveau produit"}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Nom du produit" htmlFor="nom" error={errors.nom?.message}>
          <input id="nom" className={inputClass} {...register("nom")} />
        </FormField>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Prix d'achat" htmlFor="prixAchat" error={errors.prixAchat?.message}>
            <input id="prixAchat" type="number" step="0.01" className={inputClass} {...register("prixAchat")} />
          </FormField>
          <FormField label="Prix de vente" htmlFor="prixVente" error={errors.prixVente?.message}>
            <input id="prixVente" type="number" step="0.01" className={inputClass} {...register("prixVente")} />
          </FormField>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Unité" htmlFor="unite" error={errors.unite?.message}>
            <input id="unite" placeholder="unité, kg, litre…" className={inputClass} {...register("unite")} />
          </FormField>
          <FormField label="Seuil d'alerte stock" htmlFor="seuilAlerte" error={errors.seuilAlerte?.message}>
            <input id="seuilAlerte" type="number" className={inputClass} {...register("seuilAlerte")} />
          </FormField>
        </div>

        {!isEdit && (
          <FormField label="Stock initial" htmlFor="quantiteInitiale">
            <input id="quantiteInitiale" type="number" className={inputClass} {...register("quantiteInitiale")} />
          </FormField>
        )}

        <FormField label="Catégorie (optionnel)" htmlFor="categorieId">
          <div className="flex gap-2">
            <select id="categorieId" className={selectClass} {...register("categorieId")}>
              <option value="">Aucune</option>
              {categoryList.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="mt-2 flex gap-2">
            <input
              value={newCategoryName}
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Nouvelle catégorie…"
              className={`${inputClass} flex-1`}
            />
            <Button type="button" variant="secondary" loading={addingCategory} onClick={addCategory}>
              Ajouter
            </Button>
          </div>
        </FormField>

        {isEdit && (
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-brand-600" {...register("actif")} />
            Produit actif (visible pour la vente)
          </label>
        )}

        <ModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Annuler
          </Button>
          <Button type="submit" loading={isSubmitting}>
            {isEdit ? "Enregistrer" : "Créer le produit"}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
