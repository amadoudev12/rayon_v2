import { NAV_ITEMS, NAV_SECTIONS } from "@/components/layout/navigation";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { formatMoney, formatNumber } from "@/lib/format";

/**
 * Aperçus statiques des écrans de l'application, affichés sur la page
 * d'accueil. Ils reprennent la structure, les libellés et les composants des
 * vrais écrans (tableau de bord, nouvelle vente, stock, ventes) avec les
 * données de la boutique de démonstration (`prisma/seed.ts` du backend). Aucune
 * requête : tout est statique, sans bibliothèque de graphiques.
 */

const CURRENCY = "XOF";
const money = (amount: number) => formatMoney(amount, CURRENCY);

const PRODUCTS = [
  { name: "Riz parfumé 5kg", price: 4250, stock: 40, unit: "sac", threshold: 5 },
  { name: "Huile végétale 1L", price: 1400, stock: 60, unit: "bouteille", threshold: 5 },
  { name: "Sucre en poudre 1kg", price: 800, stock: 8, unit: "kg", threshold: 5 },
  { name: "Eau minérale 1.5L", price: 400, stock: 120, unit: "bouteille", threshold: 5 },
  { name: "Jus de bissap 33cl", price: 500, stock: 3, unit: "bouteille", threshold: 5 },
  { name: "Dentifrice 100ml", price: 1000, stock: 0, unit: "pièce", threshold: 5 },
];

const LOW_STOCK = PRODUCTS.filter((product) => product.stock <= product.threshold).sort((a, b) => a.stock - b.stock);

/** Cadre commun : fenêtre, barre latérale et en-tête de l'application. */
function AppFrame({
  label,
  activeHref,
  pageTitle,
  children,
}: {
  /** Description de l'aperçu pour les lecteurs d'écran. */
  label: string;
  activeHref: string;
  pageTitle: string;
  children: React.ReactNode;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_30px_80px_-30px_rgb(15_23_42/0.28),0_10px_30px_-18px_rgb(15_23_42/0.18)]"
    >
      <div aria-hidden className="pointer-events-none select-none">
        <div className="flex h-9 items-center gap-1.5 border-b border-slate-200/80 bg-slate-50 px-4">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </div>

        <div className="flex">
          <aside className="hidden w-44 shrink-0 flex-col border-r border-slate-200/80 bg-white lg:flex">
            <div className="flex h-12 items-center gap-2 border-b border-slate-100 px-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-xs font-semibold text-white">
                B
              </span>
              <span className="min-w-0">
                <span className="block truncate text-xs font-semibold leading-tight text-slate-900">Boutique Démo</span>
                <span className="block text-[10px] leading-tight text-slate-500">Gestion de magasin</span>
              </span>
            </div>
            <div className="px-2.5 pt-3">
              <span className="flex h-8 items-center justify-center gap-1.5 rounded-lg bg-brand-600 text-xs font-medium text-white shadow-xs">
                <Icon name="plus" className="h-3.5 w-3.5" />
                Nouvelle vente
              </span>
            </div>
            <div className="space-y-3 px-2.5 py-3">
              {NAV_SECTIONS.map((section) => (
                <div key={section}>
                  <p className="mb-1 px-2 text-[9px] font-medium uppercase tracking-wider text-slate-400">{section}</p>
                  {NAV_ITEMS.filter((item) => item.section === section).map((item) => {
                    const active = item.href === activeHref;
                    return (
                      <span
                        key={item.href}
                        className={`flex h-7 items-center gap-2 rounded-lg px-2 text-xs font-medium ${
                          active ? "bg-slate-100 text-slate-900" : "text-slate-600"
                        }`}
                      >
                        <Icon name={item.icon} className={`h-3.5 w-3.5 ${active ? "text-brand-600" : "text-slate-400"}`} />
                        {item.label}
                      </span>
                    );
                  })}
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex h-12 items-center justify-between gap-3 border-b border-slate-200/80 px-4">
              <span className="flex min-w-0 items-center gap-1.5 text-xs">
                <span className="hidden truncate text-slate-500 sm:inline">Boutique Démo</span>
                <Icon name="chevronRight" className="hidden h-3 w-3 shrink-0 text-slate-300 sm:block" />
                <span className="truncate font-medium text-slate-900">{pageTitle}</span>
              </span>
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-600 text-[10px] font-semibold text-white">
                DD
              </span>
            </div>
            <div className="bg-canvas p-3 text-left sm:p-5">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200/80 bg-white shadow-card ${className}`}>{children}</div>;
}

function PanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="border-b border-slate-100 px-4 py-3">
      <p className="text-[13px] font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
    </div>
  );
}

function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-4">
      <p className="text-base font-semibold tracking-tight text-slate-900 sm:text-lg">{title}</p>
      <p className="mt-0.5 text-xs text-slate-500">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------------

const REVENUE = 486_500;
const COST_OF_GOODS_SOLD = 374_200;
const EXPENSES = 45_000;
const GROSS_MARGIN = REVENUE - COST_OF_GOODS_SOLD;
const NET_PROFIT = GROSS_MARGIN - EXPENSES;
const MARGIN_RATE = ((GROSS_MARGIN / REVENUE) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 });

const TREND = [
  { day: "lun.", value: 52_000 },
  { day: "mar.", value: 61_500 },
  { day: "mer.", value: 48_250 },
  { day: "jeu.", value: 70_500 },
  { day: "ven.", value: 66_000 },
  { day: "sam.", value: 84_750 },
  { day: "dim.", value: 38_750 },
];

const STAT_TONES = { default: "text-slate-900", success: "text-emerald-600", danger: "text-red-600" } as const;

function Stat({
  label,
  icon,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  icon: string;
  value: string;
  hint: React.ReactNode;
  tone?: keyof typeof STAT_TONES;
}) {
  return (
    <Panel className="p-3 sm:p-3.5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-[11px] font-medium leading-tight text-slate-500 sm:text-xs">{label}</p>
        <span className="hidden h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70 sm:flex">
          <Icon name={icon} className="h-3.5 w-3.5" />
        </span>
      </div>
      <p className={`tabular mt-1 text-[15px] font-semibold tracking-tight sm:text-lg ${STAT_TONES[tone]}`}>{value}</p>
      <p className="mt-1 text-[10px] leading-snug text-slate-500 sm:text-[11px]">{hint}</p>
    </Panel>
  );
}

/** Courbe du chiffre d'affaires : même rendu que le graphique du tableau de bord, en SVG statique. */
function TrendChart() {
  const width = 600;
  const height = 150;
  const max = Math.max(...TREND.map((point) => point.value)) * 1.12;
  const step = width / (TREND.length - 1);
  const points = TREND.map((point, index) => ({ x: index * step, y: height - (point.value / max) * height }));
  const line = points
    .map((point, index) => {
      if (index === 0) return `M${point.x},${point.y.toFixed(1)}`;
      const previous = points[index - 1];
      const middle = (previous.x + point.x) / 2;
      return `C${middle},${previous.y.toFixed(1)} ${middle},${point.y.toFixed(1)} ${point.x},${point.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="px-4 pb-3 pt-4">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-28 w-full sm:h-36">
        <defs>
          <linearGradient id="landingRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="#f1f5f9" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line} L${width},${height} L0,${height} Z`} fill="url(#landingRevenueFill)" />
        <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-slate-400 sm:text-[11px]">
        {TREND.map((point) => (
          <span key={point.day}>{point.day}</span>
        ))}
      </div>
    </div>
  );
}

export function DashboardMockup() {
  const trendTotal = TREND.reduce((total, point) => total + point.value, 0);

  return (
    <AppFrame
      label="Aperçu du tableau de bord : chiffre d'affaires du mois, marge brute, dépenses, bénéfice net, courbe des 7 derniers jours et produits en stock faible."
      activeHref="/dashboard"
      pageTitle="Tableau de bord"
    >
      <PageTitle title="Tableau de bord" description="Boutique Démo — Centre-ville" />

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        <Stat
          label="Chiffre d'affaires du mois"
          icon="chart"
          value={money(REVENUE)}
          hint={
            <>
              <span className="font-medium text-emerald-600">+12,4 %</span> vs même période du mois précédent
            </>
          }
        />
        <Stat label="Marge brute" icon="trendingUp" value={money(GROSS_MARGIN)} hint={`${MARGIN_RATE} % du chiffre d'affaires`} />
        <Stat label="Dépenses du mois" icon="wallet" value={money(EXPENSES)} tone="danger" hint="Boutique + charges générales" />
        <Stat label="Bénéfice net" icon="coins" value={money(NET_PROFIT)} tone="success" hint="Marge brute − dépenses" />
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <Panel className="md:col-span-2">
          <PanelHeader
            title="Chiffre d'affaires — 7 derniers jours"
            description={`${money(trendTotal)} sur la période · ventes annulées exclues`}
          />
          <TrendChart />
        </Panel>

        <Panel>
          <PanelHeader title="Stock faible" description={`${LOW_STOCK.length} produit(s) à réapprovisionner`} />
          <ul className="divide-y divide-slate-100">
            {LOW_STOCK.map((product) => (
              <li key={product.name} className="flex items-center justify-between gap-3 px-4 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-slate-900">{product.name}</span>
                  <span className="block text-[11px] text-slate-500">Seuil d&apos;alerte : {product.threshold}</span>
                </span>
                <Badge dot tone={product.stock <= 0 ? "danger" : "warning"}>
                  {product.stock <= 0 ? "Rupture" : `${product.stock} ${product.unit}`}
                </Badge>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </AppFrame>
  );
}

// ---------------------------------------------------------------------------
// Nouvelle vente
// ---------------------------------------------------------------------------

const CART = [
  { name: "Riz parfumé 5kg", price: 4250, quantity: 2 },
  { name: "Huile végétale 1L", price: 1400, quantity: 3 },
];
const CART_DISCOUNT = 200;

function FakeField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1 text-xs font-medium text-slate-700">{label}</p>
      <p className="flex h-8 items-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs text-slate-700 shadow-xs">{value}</p>
    </div>
  );
}

export function SaleMockup() {
  const subtotal = CART.reduce((total, line) => total + line.price * line.quantity, 0);

  return (
    <AppFrame
      label="Aperçu de l'écran Nouvelle vente : liste des produits avec prix et stock, panier, client, mode de paiement, remise et total à encaisser."
      activeHref="/ventes"
      pageTitle="Ventes"
    >
      <PageTitle title="Nouvelle vente" description="Ajoutez des produits au panier puis encaissez." />

      <div className="grid grid-cols-1 items-start gap-3 md:grid-cols-5">
        <Panel className="md:col-span-3">
          <PanelHeader title="Produits" description="Cliquez sur un produit pour l'ajouter au panier." />
          <div className="p-3">
            <p className="mb-3 flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-400 shadow-xs">
              <Icon name="search" className="h-3.5 w-3.5" />
              Rechercher un produit à ajouter…
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {PRODUCTS.map((product) => {
                const outOfStock = product.stock <= 0;
                return (
                  <div
                    key={product.name}
                    className={`flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2 ${
                      outOfStock ? "bg-slate-50 opacity-60" : "bg-white shadow-xs"
                    }`}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-slate-900">{product.name}</span>
                      <span className="tabular mt-0.5 block truncate text-[11px] text-slate-500">
                        <span className="font-medium text-slate-700">{money(product.price)}</span>
                        {" · "}
                        {outOfStock ? (
                          <span className="font-medium text-red-600">Rupture</span>
                        ) : (
                          `${product.stock} ${product.unit} en stock`
                        )}
                      </span>
                    </span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200">
                      <Icon name="plus" className="h-3.5 w-3.5" />
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Panel>

        <Panel className="md:col-span-2">
          <PanelHeader title="Panier" description={`${CART.length} article(s)`} />
          <ul className="divide-y divide-slate-100">
            {CART.map((line) => (
              <li key={line.name} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-medium text-slate-900">{line.name}</span>
                  <span className="tabular block text-[11px] text-slate-500">
                    {money(line.price)} × {line.quantity} ={" "}
                    <span className="font-medium text-slate-700">{money(line.price * line.quantity)}</span>
                  </span>
                </span>
                <span className="tabular flex h-7 shrink-0 items-center rounded-lg border border-slate-200 bg-white text-xs text-slate-900 shadow-xs">
                  <span className="flex w-6 justify-center text-slate-400">
                    <Icon name="minus" className="h-3 w-3" />
                  </span>
                  <span className="flex h-full w-7 items-center justify-center border-x border-slate-200">{line.quantity}</span>
                  <span className="flex w-6 justify-center text-slate-500">
                    <Icon name="plus" className="h-3 w-3" />
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="space-y-3 border-t border-slate-100 p-4">
            <FakeField label="Client (optionnel)" value="Client de passage" />
            <div className="grid grid-cols-2 gap-2.5">
              <FakeField label="Paiement" value="Espèces" />
              <FakeField label="Remise" value={formatNumber(CART_DISCOUNT)} />
            </div>
            <dl className="tabular space-y-1 rounded-lg bg-slate-50 p-3 text-xs ring-1 ring-inset ring-slate-200/70">
              <div className="flex justify-between text-slate-500">
                <dt>Sous-total</dt>
                <dd>{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between text-slate-500">
                <dt>Remise</dt>
                <dd>-{money(CART_DISCOUNT)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-slate-200/80 pt-1.5 text-slate-900">
                <dt className="font-medium">Total</dt>
                <dd className="text-base font-semibold tracking-tight">{money(subtotal - CART_DISCOUNT)}</dd>
              </div>
            </dl>
            <p className="flex h-9 items-center justify-center rounded-lg bg-brand-600 text-[13px] font-medium text-white shadow-xs">
              Encaisser la vente
            </p>
          </div>
        </Panel>
      </div>
    </AppFrame>
  );
}

// ---------------------------------------------------------------------------
// Tableaux : stock et historique des ventes
// ---------------------------------------------------------------------------

const TH = "h-9 whitespace-nowrap px-4 text-left font-medium";
const TD = "px-4 py-2.5 text-slate-600";

export function StockMockup() {
  return (
    <AppFrame
      label="Aperçu de l'écran Stock : quantité disponible de chaque produit et statut OK, stock faible ou rupture."
      activeHref="/stock"
      pageTitle="Stock"
    >
      <PageTitle title="Stock" description="Suivez les quantités disponibles et corrigez-les si besoin." />

      <Panel className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs text-slate-500">
            <tr>
              <th className={TH}>Produit</th>
              <th className={`${TH} hidden text-right sm:table-cell`}>Prix de vente</th>
              <th className={`${TH} text-right`}>Quantité</th>
              <th className={TH}>Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PRODUCTS.map((product) => {
              const isLow = product.stock <= product.threshold;
              return (
                <tr key={product.name}>
                  <td className={`${TD} font-medium text-slate-900`}>{product.name}</td>
                  <td className={`${TD} tabular hidden text-right font-medium text-slate-900 sm:table-cell`}>{money(product.price)}</td>
                  <td className={`${TD} text-right`}>
                    <span className="tabular inline-flex whitespace-nowrap rounded-md px-2 py-0.5 font-medium text-slate-900 ring-1 ring-inset ring-slate-200">
                      {product.stock} {product.unit}
                    </span>
                  </td>
                  <td className={TD}>
                    <Badge dot tone={product.stock === 0 ? "danger" : isLow ? "warning" : "success"}>
                      {product.stock === 0 ? "Rupture" : isLow ? "Stock faible" : "OK"}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Panel>
    </AppFrame>
  );
}

const SALES = [
  { id: 124, customer: "Fatou Ndiaye", seller: "Awa Démo", items: 5, total: 12_500, cancelled: false },
  { id: 123, customer: "Client de passage", seller: "Awa Démo", items: 2, total: 1_800, cancelled: false },
  { id: 122, customer: "Moussa Sow", seller: "Demo Diallo", items: 3, total: 9_300, cancelled: true },
  { id: 121, customer: "Client de passage", seller: "Awa Démo", items: 6, total: 2_400, cancelled: false },
  { id: 120, customer: "Aïcha Ba", seller: "Demo Diallo", items: 4, total: 15_150, cancelled: false },
];

export function SalesMockup() {
  return (
    <AppFrame
      label="Aperçu de l'historique des ventes : numéro de vente, client, vendeur, nombre d'articles, total et statut terminée ou annulée."
      activeHref="/ventes"
      pageTitle="Ventes"
    >
      <PageTitle title="Ventes" description="Historique des ventes de cette boutique." />

      <Panel className="overflow-hidden">
        <table className="w-full text-[13px]">
          <thead className="border-b border-slate-200/80 bg-slate-50/70 text-xs text-slate-500">
            <tr>
              <th className={TH}>Vente</th>
              <th className={TH}>Client</th>
              <th className={`${TH} hidden md:table-cell`}>Vendeur</th>
              <th className={`${TH} hidden text-right sm:table-cell`}>Articles</th>
              <th className={`${TH} text-right`}>Total</th>
              <th className={`${TH} hidden sm:table-cell`}>Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SALES.map((sale) => (
              <tr key={sale.id}>
                <td className={`${TD} tabular font-medium text-slate-900`}>#{String(sale.id).padStart(5, "0")}</td>
                <td className={TD}>{sale.customer}</td>
                <td className={`${TD} hidden md:table-cell`}>{sale.seller}</td>
                <td className={`${TD} tabular hidden text-right sm:table-cell`}>{sale.items}</td>
                <td
                  className={`${TD} tabular whitespace-nowrap text-right font-medium ${
                    sale.cancelled ? "text-slate-400 line-through" : "text-slate-900"
                  }`}
                >
                  {money(sale.total)}
                </td>
                <td className={`${TD} hidden sm:table-cell`}>
                  <Badge dot tone={sale.cancelled ? "danger" : "success"}>
                    {sale.cancelled ? "Annulée" : "Terminée"}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </AppFrame>
  );
}
