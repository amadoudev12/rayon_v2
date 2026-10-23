import { formatDate, formatDateTime, formatMoney } from "@/lib/format";

/**
 * Documents commerciaux imprimables : reçu de vente, devis, bon d'achat.
 *
 * Chaque écran décrit son document avec ce même modèle ; il est ensuite
 * imprimé (page HTML dans un cadre invisible, puis boîte d'impression du
 * navigateur) ou généré en vrai fichier PDF (jsPDF, chargé à la demande).
 */
export type CommercialDocument = {
  /** « Reçu de vente », « Devis », « Bon d'achat ». */
  title: string;
  number: string;
  date: string | Date;
  /** Afficher l'heure avec la date (reçus). */
  withTime?: boolean;
  shop: { name: string; storeName?: string; address?: string | null; phone?: string | null };
  party?: { label: string; name: string; details?: (string | null | undefined)[] };
  /** Mentions sous l'en-tête : mode de paiement, vendeur, validité… */
  meta?: { label: string; value: string }[];
  /** Bandeau mis en évidence, ex : « Vente à crédit ». */
  badge?: string;
  lines: { designation: string; quantity: string; unitPrice: number; total: number }[];
  totals: { label: string; value: number; strong?: boolean }[];
  /** Tableau complémentaire, ex : historique des versements d'un crédit. */
  history?: { title: string; rows: { label: string; value: number }[] };
  note?: string | null;
  footer?: string;
  currency: string;
  fileName: string;
};

/** Espaces insécables produits par `Intl` : ils ne passent pas dans les polices PDF standard. */
const NON_BREAKING_SPACES = new RegExp("[\\u202f\\u00a0]", "g");

/** Montant pour l'impression. */
function money(value: number, currency: string) {
  return formatMoney(value, currency).replace(NON_BREAKING_SPACES, " ");
}

function dateLabel(doc: CommercialDocument) {
  return (doc.withTime ? formatDateTime(doc.date) : formatDate(doc.date, { dateStyle: "long" })).replace(NON_BREAKING_SPACES, " ");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

function shopLines(doc: CommercialDocument) {
  return [doc.shop.storeName && doc.shop.storeName !== doc.shop.name ? doc.shop.storeName : null, doc.shop.address, doc.shop.phone].filter(
    (line): line is string => Boolean(line),
  );
}

// ---------------------------------------------------------------------------
// Impression
// ---------------------------------------------------------------------------

function renderHtml(doc: CommercialDocument) {
  const e = escapeHtml;
  const party = doc.party
    ? `<div class="box"><div class="label">${e(doc.party.label)}</div><div class="strong">${e(doc.party.name)}</div>${doc.party.details
        ?.filter(Boolean)
        .map((line) => `<div>${e(line!)}</div>`)
        .join("") ?? ""}</div>`
    : "";
  const meta = (doc.meta ?? []).map((item) => `<div><span class="label">${e(item.label)} :</span> ${e(item.value)}</div>`).join("");
  const rows = doc.lines
    .map(
      (line) =>
        `<tr><td>${e(line.designation)}</td><td class="num">${e(line.quantity)}</td><td class="num">${e(money(line.unitPrice, doc.currency))}</td><td class="num">${e(money(line.total, doc.currency))}</td></tr>`,
    )
    .join("");
  const totals = doc.totals
    .map((total) => `<tr class="${total.strong ? "strong" : ""}"><td>${e(total.label)}</td><td class="num">${e(money(total.value, doc.currency))}</td></tr>`)
    .join("");
  const history = doc.history?.rows.length
    ? `<h3>${e(doc.history.title)}</h3><table class="lines"><tbody>${doc.history.rows
        .map((row) => `<tr><td>${e(row.label)}</td><td class="num">${e(money(row.value, doc.currency))}</td></tr>`)
        .join("")}</tbody></table>`
    : "";

  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${e(doc.title)} ${e(doc.number)}</title><style>
@page { size: A4; margin: 16mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Inter, "Segoe UI", Arial, sans-serif; color: #0f172a; font-size: 12px; }
.head { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 12px; }
.shop { font-size: 18px; font-weight: 700; }
.muted, .label { color: #64748b; }
.doc { text-align: right; }
.doc .title { font-size: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: .04em; }
.badge { display: inline-block; margin-top: 6px; padding: 3px 10px; border: 1.5px solid #b45309; color: #b45309; font-weight: 700; text-transform: uppercase; border-radius: 4px; }
.info { display: flex; justify-content: space-between; gap: 24px; margin: 16px 0; }
.box { min-width: 45%; }
.strong { font-weight: 600; }
table { width: 100%; border-collapse: collapse; }
.lines th { text-align: left; background: #f1f5f9; padding: 7px 8px; font-size: 11px; color: #475569; }
.lines td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
.num { text-align: right; white-space: nowrap; }
.totals { width: 300px; margin: 14px 0 0 auto; }
.totals td { padding: 4px 8px; }
.totals tr.strong td { font-size: 14px; font-weight: 700; border-top: 1.5px solid #0f172a; }
h3 { margin: 22px 0 6px; font-size: 12px; }
.note { margin-top: 18px; padding: 8px 10px; background: #f8fafc; border-left: 3px solid #cbd5e1; }
.footer { margin-top: 28px; text-align: center; color: #64748b; font-size: 11px; }
</style></head><body>
<div class="head"><div><div class="shop">${e(doc.shop.name)}</div>${shopLines(doc).map((line) => `<div class="muted">${e(line)}</div>`).join("")}</div>
<div class="doc"><div class="title">${e(doc.title)}</div><div class="strong">N° ${e(doc.number)}</div><div class="muted">${e(dateLabel(doc))}</div>${doc.badge ? `<div class="badge">${e(doc.badge)}</div>` : ""}</div></div>
<div class="info">${party}<div>${meta}</div></div>
<table class="lines"><thead><tr><th>Désignation</th><th class="num">Qté</th><th class="num">Prix unitaire</th><th class="num">Montant</th></tr></thead><tbody>${rows}</tbody></table>
<table class="totals"><tbody>${totals}</tbody></table>
${history}
${doc.note ? `<div class="note"><span class="strong">Note :</span> ${e(doc.note)}</div>` : ""}
${doc.footer ? `<div class="footer">${e(doc.footer)}</div>` : ""}
</body></html>`;
}

/** Ouvre la boîte d'impression du navigateur pour ce document (sans quitter la page). */
export function printDocument(doc: CommercialDocument) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  frame.srcdoc = renderHtml(doc);
  frame.onload = () => {
    const view = frame.contentWindow;
    if (!view) return;
    view.addEventListener("afterprint", () => frame.remove());
    view.focus();
    view.print();
    // Filet de sécurité si « afterprint » n'est pas émis.
    setTimeout(() => frame.remove(), 60_000);
  };
  document.body.appendChild(frame);
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

async function renderPdf(doc: CommercialDocument): Promise<Blob> {
  const [{ jsPDF }, { autoTable }] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const pdf = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const left = 16;
  const right = pageWidth - 16;
  const dark: [number, number, number] = [15, 23, 42];
  const muted: [number, number, number] = [100, 116, 139];

  // En-tête : magasin à gauche, document à droite.
  pdf.setTextColor(...dark).setFont("helvetica", "bold").setFontSize(16).text(doc.shop.name, left, 20);
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted);
  shopLines(doc).forEach((line, index) => pdf.text(line, left, 26 + index * 4.5));

  pdf.setTextColor(...dark).setFont("helvetica", "bold").setFontSize(16).text(doc.title.toUpperCase(), right, 20, { align: "right" });
  pdf.setFontSize(10).text(`N° ${doc.number}`, right, 26, { align: "right" });
  pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted).text(dateLabel(doc), right, 31, { align: "right" });
  if (doc.badge) {
    const width = pdf.setFont("helvetica", "bold").getTextWidth(doc.badge.toUpperCase()) + 6;
    pdf.setDrawColor(180, 83, 9).setTextColor(180, 83, 9).roundedRect(right - width, 34, width, 6.5, 1, 1);
    pdf.text(doc.badge.toUpperCase(), right - 3, 38.4, { align: "right" });
  }

  const headerBottom = Math.max(26 + shopLines(doc).length * 4.5, doc.badge ? 43 : 35);
  pdf.setDrawColor(...dark).setLineWidth(0.6).line(left, headerBottom, right, headerBottom);

  // Client / fournisseur et mentions.
  let y = headerBottom + 8;
  let partyBottom = y;
  if (doc.party) {
    pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted).text(doc.party.label, left, y);
    pdf.setFont("helvetica", "bold").setFontSize(11).setTextColor(...dark).text(doc.party.name, left, y + 5);
    pdf.setFont("helvetica", "normal").setFontSize(9);
    const details = (doc.party.details ?? []).filter((line): line is string => Boolean(line));
    details.forEach((line, index) => pdf.text(line, left, y + 10 + index * 4.5));
    partyBottom = y + 10 + details.length * 4.5;
  }
  (doc.meta ?? []).forEach((item, index) => {
    pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted).text(`${item.label} :`, pageWidth / 2 + 10, y + index * 5);
    pdf.setTextColor(...dark).text(item.value, right, y + index * 5, { align: "right" });
  });
  y = Math.max(partyBottom, y + (doc.meta?.length ?? 0) * 5) + 4;

  // Lignes du document.
  autoTable(pdf, {
    startY: y,
    margin: { left, right: 16 },
    head: [["Désignation", "Qté", "Prix unitaire", "Montant"]],
    body: doc.lines.map((line) => [line.designation, line.quantity, money(line.unitPrice, doc.currency), money(line.total, doc.currency)]),
    styles: { font: "helvetica", fontSize: 9, textColor: dark, cellPadding: 2.2 },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
    columnStyles: { 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    didParseCell: (data) => {
      if (data.section === "head" && data.column.index > 0) data.cell.styles.halign = "right";
    },
  });
  y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  // Totaux, alignés à droite.
  const labelX = right - 75;
  for (const [index, total] of doc.totals.entries()) {
    // Une ligne en gras (Total, Reste à payer) est précédée d'un trait : on lui laisse de l'air.
    if (total.strong && index > 0) y += 2;
    if (y > 275) {
      pdf.addPage();
      y = 20;
    }
    pdf.setFont("helvetica", total.strong ? "bold" : "normal").setFontSize(total.strong ? 11 : 9.5).setTextColor(...dark);
    if (total.strong) pdf.setLineWidth(0.4).line(labelX, y - 4.5, right, y - 4.5);
    pdf.text(total.label, labelX, y);
    pdf.text(money(total.value, doc.currency), right, y, { align: "right" });
    y += total.strong ? 7 : 5.5;
  }

  if (doc.history?.rows.length) {
    autoTable(pdf, {
      startY: y + 4,
      margin: { left, right: 16 },
      head: [[doc.history.title, ""]],
      body: doc.history.rows.map((row) => [row.label, money(row.value, doc.currency)]),
      styles: { font: "helvetica", fontSize: 9, textColor: dark, cellPadding: 2 },
      headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
      columnStyles: { 1: { halign: "right" } },
    });
    y = (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
  }

  if (doc.note) {
    const lines = pdf.setFont("helvetica", "normal").setFontSize(9).splitTextToSize(`Note : ${doc.note}`, right - left);
    pdf.setTextColor(...muted).text(lines, left, y + 6);
    y += 6 + lines.length * 4.5;
  }
  if (doc.footer) {
    pdf.setFont("helvetica", "normal").setFontSize(9).setTextColor(...muted).text(doc.footer, pageWidth / 2, Math.max(y + 12, 282), {
      align: "center",
    });
  }

  return pdf.output("blob");
}

/** Génère le PDF et le télécharge. */
export async function downloadDocumentPdf(doc: CommercialDocument) {
  const blob = await renderPdf(doc);
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${doc.fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Partage du PDF (WhatsApp, e-mail…) via le menu de partage de l'appareil, quand il le permet. */
export function canShareFiles() {
  return typeof navigator !== "undefined" && typeof navigator.canShare === "function";
}

export async function shareDocumentPdf(doc: CommercialDocument): Promise<boolean> {
  const file = new File([await renderPdf(doc)], `${doc.fileName}.pdf`, { type: "application/pdf" });
  if (!navigator.canShare?.({ files: [file] })) return false;
  try {
    await navigator.share({ files: [file], title: `${doc.title} ${doc.number}` });
  } catch (error) {
    // Partage annulé par l'utilisateur : ce n'est pas une erreur.
    if (error instanceof DOMException && error.name === "AbortError") return true;
    throw error;
  }
  return true;
}

/**
 * Lien WhatsApp vers le numéro du client, avec un message prérempli.
 * Le numéro doit être au format international (ex : +221 77 123 45 67).
 */
export function whatsappLink(phone: string, message: string) {
  const digits = phone.replace(/^00/, "").replace(/\D/g, "");
  return digits.length >= 8 ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}
