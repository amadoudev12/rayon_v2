import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { EXPENSES, GROSS_MARGIN, LOW_STOCK, NET_PROFIT, REVENUE, TOP_PRODUCTS, TREND, money } from "../data";
import { progress, riseIn, track } from "../motion";
import {
  AppWindow,
  Backdrop,
  Caption,
  Cursor,
  Highlight,
  NEW_SALE_BUTTON,
  PAGE_ORIGIN,
  PAGE_PADDING,
  PAGE_TITLE_HEIGHT,
  PageTitle,
  Panel,
  PanelHeader,
  Shot,
  WIDE_SHOT,
  WINDOW_WIDTH,
  type SceneProps,
} from "../parts";

// Géométrie de la page, dans le repère de la fenêtre : elle sert à viser les
// cartes avec la caméra et l'anneau de mise en évidence.
const CONTENT_WIDTH = WINDOW_WIDTH - PAGE_ORIGIN.x - PAGE_PADDING * 2;
const GAP = 16;
const STAT_HEIGHT = 124;
const STAT_WIDTH = (CONTENT_WIDTH - GAP * 3) / 4;
const STATS_X = PAGE_ORIGIN.x + PAGE_PADDING;
const STATS_Y = PAGE_ORIGIN.y + PAGE_PADDING + PAGE_TITLE_HEIGHT;

const STATS_SHOT = { focusX: STATS_X + CONTENT_WIDTH / 2, focusY: STATS_Y + STAT_HEIGHT / 2, scale: 1.5 };

const CAMERA = [
  { at: 0, ...WIDE_SHOT },
  { at: 3500, ...WIDE_SHOT },
  { at: 4500, ...STATS_SHOT },
  { at: 6500, ...STATS_SHOT },
  { at: 7400, ...WIDE_SHOT },
];

const CLICK_NEW_SALE = 8350;
const CURSOR_PATH = [
  { at: 7100, x: 980, y: 640 },
  { at: 8200, ...NEW_SALE_BUTTON },
];

const MARGIN_RATE = ((GROSS_MARGIN / REVENUE) * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 });

const STATS = [
  {
    label: "Chiffre d'affaires du mois",
    icon: "chart",
    value: REVENUE,
    tone: "text-slate-900",
    hint: (
      <>
        <span className="font-medium text-emerald-600">+12,4 %</span> vs mois précédent
      </>
    ),
  },
  { label: "Marge brute", icon: "trendingUp", value: GROSS_MARGIN, tone: "text-slate-900", hint: `${MARGIN_RATE} % du chiffre d'affaires` },
  { label: "Dépenses du mois", icon: "wallet", value: EXPENSES, tone: "text-red-600", hint: "Boutique + charges générales" },
  { label: "Bénéfice net", icon: "coins", value: NET_PROFIT, tone: "text-emerald-600", hint: "Marge brute − dépenses" },
];

/** Tableau de bord : la fenêtre arrive, les chiffres se comptent, puis gros plan sur le bénéfice. */
export function DashboardScene({ time }: SceneProps) {
  const camera = track(time, CAMERA);
  const trendTotal = TREND.reduce((total, point) => total + point.value, 0);

  return (
    <div className="absolute inset-0">
      <Backdrop />

      <Shot camera={camera} entrance={progress(time, 100, 1100)}>
        <AppWindow activeHref="/dashboard" pageTitle="Tableau de bord">
          <PageTitle title="Tableau de bord" description="Boutique Démo · Centre-ville" />

          <div className="flex" style={{ gap: GAP, height: STAT_HEIGHT }}>
            {STATS.map((stat, index) => (
              <Panel key={stat.label} className="flex-1 p-5" style={riseIn(time, 800 + index * 120)}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-[13px] font-medium text-slate-500">{stat.label}</p>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200/70">
                    <Icon name={stat.icon} className="h-4 w-4" />
                  </span>
                </div>
                <p className={`tabular -mt-1 text-2xl font-semibold tracking-tight ${stat.tone}`}>
                  {money(stat.value * progress(time, 1000 + index * 120, 1400))}
                </p>
                <p className="mt-1.5 text-xs text-slate-500">{stat.hint}</p>
              </Panel>
            ))}
          </div>

          <div className="flex" style={{ gap: GAP, marginTop: GAP, height: 432 }}>
            <Panel className="flex-2" style={riseIn(time, 1300)}>
              <PanelHeader title="Chiffre d'affaires — 7 derniers jours" description={`${money(trendTotal)} sur la période · ventes annulées exclues`} />
              <TrendChart drawn={progress(time, 1700, 1500)} />
            </Panel>

            <div className="flex flex-1 flex-col" style={{ gap: GAP }}>
              <Panel style={riseIn(time, 1450)}>
                <PanelHeader title="Stock faible" description={`${LOW_STOCK.length} produit(s) à réapprovisionner`} />
                <ul className="divide-y divide-slate-100">
                  {LOW_STOCK.map((product, index) => (
                    <li key={product.name} className="flex h-13.5 items-center justify-between gap-3 px-5" style={riseIn(time, 1900 + index * 130, { distance: 12 })}>
                      <span>
                        <span className="block text-sm font-medium text-slate-900">{product.name}</span>
                        <span className="block text-xs text-slate-500">Seuil d&apos;alerte : {product.threshold}</span>
                      </span>
                      <Badge dot tone={product.stock <= 0 ? "danger" : "warning"}>
                        {product.stock <= 0 ? "Rupture" : `${product.stock} ${product.unit}`}
                      </Badge>
                    </li>
                  ))}
                </ul>
              </Panel>

              <Panel className="flex-1" style={riseIn(time, 1600)}>
                <div className="flex h-11 items-center border-b border-slate-100 px-5 text-sm font-semibold text-slate-900">Meilleures ventes du mois</div>
                <ul className="divide-y divide-slate-100">
                  {TOP_PRODUCTS.map((product, index) => (
                    <li key={product.name} className="flex h-10 items-center justify-between gap-3 px-5 text-sm" style={riseIn(time, 2200 + index * 130, { distance: 12 })}>
                      <span className="font-medium text-slate-900">{product.name}</span>
                      <span className="tabular font-medium text-slate-700">{money(product.amount)}</span>
                    </li>
                  ))}
                </ul>
              </Panel>
            </div>
          </div>
        </AppWindow>

        <Highlight time={time} start={4900} end={6500} x={STATS_X + (STAT_WIDTH + GAP) * 3} y={STATS_Y} width={STAT_WIDTH} height={STAT_HEIGHT} />
        <Cursor time={time} path={CURSOR_PATH} clicks={[CLICK_NEW_SALE]} />
      </Shot>

      <Caption time={time} start={300} end={3700} eyebrow="Tableau de bord" title="Pilotez votre boutique" accent="en un coup d'œil" />
      <Caption time={time} start={4100} end={7000} eyebrow="Marge et bénéfice" title="Votre bénéfice," accent="pas seulement vos recettes" />
    </div>
  );
}

/** Courbe du chiffre d'affaires, dévoilée de gauche à droite (`drawn` de 0 à 1). */
function TrendChart({ drawn }: { drawn: number }) {
  const width = 700;
  const height = 250;
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
    <div className="px-5 pb-4 pt-5">
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-70.5 w-full" style={{ clipPath: `inset(-4px ${(1 - drawn) * 100}% -4px 0)` }}>
        <defs>
          <linearGradient id="demoRevenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line key={ratio} x1="0" x2={width} y1={height * ratio} y2={height * ratio} stroke="#f1f5f9" vectorEffect="non-scaling-stroke" />
        ))}
        <path d={`${line} L${width},${height} L0,${height} Z`} fill="url(#demoRevenueFill)" />
        <path d={line} fill="none" stroke="#4f46e5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
      </svg>
      <div className="mt-2 flex justify-between text-xs text-slate-400">
        {TREND.map((point) => (
          <span key={point.day}>{point.day}</span>
        ))}
      </div>
    </div>
  );
}
