import { PRODUCT_IMPORT_MAX_ROWS, productImportRowSchema, type ProductImportRow } from "@/lib/validations/product";

type Field = Exclude<keyof ProductImportRow, "ligne">;
type CellValue = string | number | boolean | Date | null | undefined;

/**
 * Colonnes reconnues dans le fichier. `aliases` liste les titres acceptés,
 * déjà normalisés (voir `normalizeTitle`) : le magasinier n'a pas à reprendre
 * le modèle au mot près.
 */
export const IMPORT_COLUMNS: {
  field: Field;
  title: string;
  required: boolean;
  numeric: boolean;
  hint: string;
  aliases: string[];
}[] = [
  {
    field: "nom",
    title: "Nom",
    required: true,
    numeric: false,
    hint: "Nom du produit",
    aliases: ["nom", "nom du produit", "nom produit", "produit", "designation", "libelle", "article"],
  },
  {
    field: "prixAchat",
    title: "Prix d'achat",
    required: true,
    numeric: true,
    hint: "Nombre, 0 ou plus",
    aliases: ["prix d achat", "prix achat", "prix dachat", "cout", "cout d achat", "pa"],
  },
  {
    field: "prixVente",
    title: "Prix de vente",
    required: true,
    numeric: true,
    hint: "Nombre supérieur à 0",
    aliases: ["prix de vente", "prix vente", "prix", "pv"],
  },
  {
    field: "quantiteInitiale",
    title: "Stock initial",
    required: false,
    numeric: true,
    hint: "Nombre entier, 0 si vide",
    aliases: ["stock initial", "stock", "quantite", "quantite initiale", "qte", "qte initiale"],
  },
  {
    field: "unite",
    title: "Unité",
    required: false,
    numeric: false,
    hint: "« unité » si vide",
    aliases: ["unite", "unite de mesure"],
  },
  {
    field: "seuilAlerte",
    title: "Seuil d'alerte",
    required: false,
    numeric: true,
    hint: "Nombre entier, 5 si vide",
    aliases: ["seuil d alerte", "seuil alerte", "seuil dalerte", "seuil", "stock minimum", "stock min"],
  },
  {
    field: "categorie",
    title: "Catégorie",
    required: false,
    numeric: false,
    hint: "Créée si elle n'existe pas",
    aliases: ["categorie", "famille", "rayon"],
  },
  {
    field: "reference",
    title: "Référence",
    required: false,
    numeric: false,
    hint: "Unique par produit",
    aliases: ["reference", "ref", "code", "code produit", "sku"],
  },
  {
    field: "codeBarres",
    title: "Code-barres",
    required: false,
    numeric: false,
    hint: "",
    aliases: ["code barres", "code barre", "codebarres", "codebarre", "ean"],
  },
  {
    field: "description",
    title: "Description",
    required: false,
    numeric: false,
    hint: "",
    aliases: ["description", "details", "note"],
  },
];

const DEFAULTS = { unite: "unité", seuilAlerte: 5 };

export type ImportRowError = { ligne: number; nom: string; messages: string[] };

export type ParsedImport = {
  /** Lignes valides, prêtes à être envoyées à l'API. */
  rows: ProductImportRow[];
  /** Lignes du fichier qui ne peuvent pas être importées telles quelles. */
  errors: ImportRowError[];
};

/** Erreur liée au fichier lui-même (format, colonnes), affichable telle quelle. */
export class ImportFileError extends Error {}

/** « Prix d'achat * » → « prix d achat » : sans accents, ponctuation ni casse. */
function normalizeTitle(value: CellValue) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toText(value: CellValue) {
  return value == null ? "" : String(value).trim();
}

/** Accepte les nombres saisis en texte à la française : « 1 500,50 ». */
function toNumberInput(value: CellValue) {
  if (typeof value === "number") return value;
  const text = toText(value).replace(/\s/g, "").replace(",", ".");
  // Un texte non numérique devient NaN, que la validation signalera.
  return text === "" ? undefined : Number(text);
}

/** Lit la première feuille d'un fichier Excel et valide chaque ligne de produit. */
export async function parseProductFile(file: File): Promise<ParsedImport> {
  if (!/\.xlsx$/i.test(file.name)) {
    throw new ImportFileError(
      "Format non pris en charge. Enregistrez le fichier au format Excel (.xlsx) puis réessayez.",
    );
  }

  let sheet: CellValue[][];
  try {
    // Chargée à la demande : la bibliothèque ne pèse pas sur le reste du site.
    const { readSheet } = await import("read-excel-file/browser");
    sheet = (await readSheet(file)) as CellValue[][];
  } catch {
    throw new ImportFileError("Impossible de lire ce fichier. Vérifiez qu'il s'agit bien d'un fichier Excel (.xlsx).");
  }

  const [header, ...lines] = sheet;
  if (!header) throw new ImportFileError("Le fichier est vide.");

  const columnIndex = new Map<Field, number>();
  header.forEach((cell, index) => {
    const title = normalizeTitle(cell);
    const column = IMPORT_COLUMNS.find((candidate) => candidate.aliases.includes(title));
    if (column && !columnIndex.has(column.field)) columnIndex.set(column.field, index);
  });

  const missing = IMPORT_COLUMNS.filter((column) => column.required && !columnIndex.has(column.field));
  if (missing.length > 0) {
    throw new ImportFileError(
      `Colonne${missing.length > 1 ? "s" : ""} introuvable${missing.length > 1 ? "s" : ""} : ${missing
        .map((column) => `« ${column.title} »`)
        .join(", ")}. La première ligne du fichier doit contenir les titres des colonnes.`,
    );
  }

  const rows: ProductImportRow[] = [];
  const errors: ImportRowError[] = [];

  lines.forEach((cells, index) => {
    if (cells.every((cell) => toText(cell) === "")) return;
    // La ligne 1 du fichier est celle des titres.
    const ligne = index + 2;

    const raw: Record<string, unknown> = { ligne };
    for (const column of IMPORT_COLUMNS) {
      const position = columnIndex.get(column.field);
      const cell = position === undefined ? undefined : cells[position];
      raw[column.field] = column.numeric ? toNumberInput(cell) : toText(cell);
    }
    raw.unite ||= DEFAULTS.unite;
    raw.seuilAlerte ??= DEFAULTS.seuilAlerte;

    const parsed = productImportRowSchema.safeParse(raw);
    if (parsed.success) {
      rows.push(parsed.data);
      return;
    }

    const messages = parsed.error.issues.map((issue) => {
      const column = IMPORT_COLUMNS.find((candidate) => candidate.field === issue.path[0]);
      // Les messages par défaut de zod sont en anglais : on les remplace.
      const message = issue.message.startsWith("Invalid") ? "valeur manquante ou invalide." : issue.message;
      return column ? `${column.title} : ${message}` : message;
    });
    errors.push({ ligne, nom: toText(raw.nom as CellValue) || "(sans nom)", messages });
  });

  if (rows.length === 0 && errors.length === 0) {
    throw new ImportFileError("Le fichier ne contient aucun produit sous la ligne des titres.");
  }
  if (rows.length > PRODUCT_IMPORT_MAX_ROWS) {
    throw new ImportFileError(
      `Le fichier contient ${rows.length} produits : un import est limité à ${PRODUCT_IMPORT_MAX_ROWS}. Découpez-le en plusieurs fichiers.`,
    );
  }

  return { rows, errors };
}

/** Télécharge un fichier Excel vide portant les titres de colonnes attendus. */
export async function downloadImportTemplate() {
  const { default: writeXlsxFile } = await import("write-excel-file/browser");
  const header = IMPORT_COLUMNS.map((column) => ({ value: column.title, fontWeight: "bold" as const }));
  await writeXlsxFile([header], {
    columns: IMPORT_COLUMNS.map((column) => ({ width: Math.max(column.title.length + 6, 16) })),
  }).toFile("modele-import-produits.xlsx");
}
