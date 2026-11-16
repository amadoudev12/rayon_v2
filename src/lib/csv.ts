type Cell = string | number | null | undefined;

/**
 * Cellule CSV lisible par Excel en français (virgule décimale). Un texte
 * commençant par = + - @ est neutralisé : un nom de produit piégé ne peut pas
 * exécuter de formule à l'ouverture du fichier.
 */
function csvCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  const text = typeof value === "number" ? String(value).replace(".", ",") : /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

/** Télécharge un petit tableau déjà affiché (les exports complets sont produits par le serveur). */
export function downloadCsv(filename: string, headers: string[], rows: Cell[][]) {
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
