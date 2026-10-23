import { Badge } from "@/components/ui/Badge";
import { PRODUCTS, SALE_LINES, money } from "../data";
import { clamp01, mix, progress, riseIn, track } from "../motion";
import {
  AppWindow,
  Backdrop,
  Caption,
  Highlight,
  PAGE_ORIGIN,
  PAGE_PADDING,
  PAGE_TITLE_HEIGHT,
  PageTitle,
  Panel,
  Shot,
  WIDE_SHOT,
  WINDOW_WIDTH,
  type SceneProps,
} from "../parts";

// Géométrie du tableau, dans le repère de la fenêtre.
const TABLE_X = PAGE_ORIGIN.x + PAGE_PADDING;
const TABLE_Y = PAGE_ORIGIN.y + PAGE_PADDING + PAGE_TITLE_HEIGHT;
const TABLE_WIDTH = WINDOW_WIDTH - PAGE_ORIGIN.x - PAGE_PADDING * 2;
const HEAD_HEIGHT = 44;
const ROW_HEIGHT = 76;
const COLUMNS = "grid grid-cols-[1fr_220px_220px_240px] items-center px-5";

/** Instant où la vente de la scène précédente est décomptée, ligne par ligne. */
const SALE_APPLIED_AT = 1700;
const SALE_STAGGER = 450;

// Les produits sous leur seuil d'alerte sont les derniers de la liste : la caméra s'en approche.
const FIRST_ALERT_ROW = PRODUCTS.findIndex((product) => product.stock <= product.threshold);
const ALERTS_Y = TABLE_Y + HEAD_HEIGHT + FIRST_ALERT_ROW * ROW_HEIGHT;
const ALERTS_HEIGHT = (PRODUCTS.length - FIRST_ALERT_ROW) * ROW_HEIGHT;
const ALERTS_SHOT = { focusX: TABLE_X + TABLE_WIDTH / 2, focusY: 480, scale: 1.4 };

const CAMERA = [
  { at: 0, ...WIDE_SHOT },
  { at: 4000, ...WIDE_SHOT },
  { at: 4900, ...ALERTS_SHOT },
  { at: 9000, ...ALERTS_SHOT },
];

/** Stock : les quantités vendues à l'instant sont retirées, puis gros plan sur les alertes. */
export function StockScene({ time }: SceneProps) {
  const camera = track(time, CAMERA);

  return (
    <div className="absolute inset-0">
      <Backdrop />

      <Shot camera={camera}>
        <AppWindow activeHref="/stock" pageTitle="Stock">
          <PageTitle title="Stock" description="Suivez les quantités disponibles et corrigez-les si besoin." />

          <Panel className="overflow-hidden text-sm">
            <div className={`${COLUMNS} border-b border-slate-200/80 bg-slate-50/70 text-[13px] font-medium text-slate-500`} style={{ height: HEAD_HEIGHT }}>
              <span>Produit</span>
              <span className="text-right">Prix de vente</span>
              <span className="text-right">Quantité</span>
              <span className="pl-10">Statut</span>
            </div>

            {PRODUCTS.map((product, index) => {
              const saleIndex = SALE_LINES.findIndex((line) => line.productIndex === index);
              const soldAt = SALE_APPLIED_AT + saleIndex * SALE_STAGGER;
              const sold = saleIndex !== -1 && time >= soldAt ? SALE_LINES[saleIndex].quantity : 0;
              // La ligne modifiée s'éclaire, puis retrouve sa couleur.
              const flash = saleIndex !== -1 && time >= soldAt ? 1 - clamp01((time - soldAt) / 1400) : 0;
              const stock = product.stock - sold;
              const isLow = stock <= product.threshold;

              return (
                <div
                  key={product.name}
                  className={`${COLUMNS} border-b border-slate-100 last:border-b-0`}
                  style={{ height: ROW_HEIGHT, backgroundColor: `rgb(224 231 255 / ${flash * 0.8})`, ...riseIn(time, 250 + index * 90, { distance: 16 }) }}
                >
                  <span className="font-medium text-slate-900">{product.name}</span>
                  <span className="tabular text-right font-medium text-slate-900">{money(product.price)}</span>
                  <span className="text-right">
                    <span className="tabular relative inline-flex rounded-md px-2.5 py-1 font-medium text-slate-900 ring-1 ring-inset ring-slate-200">
                      {saleIndex !== -1 && <SoldChip time={time} start={soldAt} quantity={SALE_LINES[saleIndex].quantity} />}
                      {stock} {product.unit}
                    </span>
                  </span>
                  <span className="pl-10">
                    <Badge dot tone={stock === 0 ? "danger" : isLow ? "warning" : "success"}>
                      {stock === 0 ? "Rupture" : isLow ? "Stock faible" : "OK"}
                    </Badge>
                  </span>
                </div>
              );
            })}
          </Panel>
        </AppWindow>

        <Highlight time={time} start={5200} end={9000} x={TABLE_X} y={ALERTS_Y} width={TABLE_WIDTH} height={ALERTS_HEIGHT} />
      </Shot>

      <Caption time={time} start={300} end={3900} eyebrow="Stock" title="Un stock qui se met à jour" accent="tout seul" />
      <Caption time={time} start={4500} end={9000} eyebrow="Alertes" title="Prévenu" accent="avant la rupture" />
    </div>
  );
}

/** Étiquette « −2 vente » qui s'élève à gauche de la quantité au moment où la vente est décomptée. */
function SoldChip({ time, start, quantity }: { time: number; start: number; quantity: number }) {
  if (time < start) return null;
  const enter = progress(time, start, 400);
  const exit = progress(time, start + 1500, 500);
  return (
    <span
      className="absolute right-full top-1/2 mr-2.5 whitespace-nowrap rounded-md bg-brand-600 px-2 py-0.5 text-[13px] font-semibold text-white"
      style={{ opacity: enter * (1 - exit), transform: `translateY(${mix(-30, -50, enter)}%)` }}
    >
      −{quantity} vente
    </span>
  );
}
