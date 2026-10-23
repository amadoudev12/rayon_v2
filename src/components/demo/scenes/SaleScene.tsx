import { Icon } from "@/components/ui/Icon";
import { PRODUCTS, SALE_LINES, money } from "../data";
import { clamp01, easeOutBack, mix, progress, riseIn, track } from "../motion";
import {
  AppWindow,
  Backdrop,
  Caption,
  Cursor,
  NEW_SALE_BUTTON,
  PAGE_ORIGIN,
  PAGE_PADDING,
  PAGE_TITLE_HEIGHT,
  PANEL_HEADER_HEIGHT,
  PageTitle,
  Panel,
  PanelHeader,
  STOCK_NAV_ITEM,
  Shot,
  WIDE_SHOT,
  type SceneProps,
} from "../parts";

// Géométrie de la page, dans le repère de la fenêtre. Les panneaux sont
// dessinés à partir de ces valeurs, et le pointeur vise les mêmes : il tombe
// donc toujours sur les boutons.
const PANELS_X = PAGE_ORIGIN.x + PAGE_PADDING;
const PANELS_Y = PAGE_ORIGIN.y + PAGE_PADDING + PAGE_TITLE_HEIGHT;
const PANELS_HEIGHT = 570;
const PANELS_GAP = 16;
const PRODUCTS_WIDTH = 708;
const CART_WIDTH = 470;
const CART_X = PANELS_X + PRODUCTS_WIDTH + PANELS_GAP;

const PRODUCTS_PADDING = 16;
const SEARCH_HEIGHT = 42;
const SEARCH_MARGIN = 14;
const PRODUCT_CARD = { width: 330, height: 64, gap: 12 };

const CART_LINE_HEIGHT = 64;
const CART_PADDING = 20;
const FIELD_HEIGHT = 66;
const FIELD_GAP = 14;
const TOTALS_HEIGHT = 112;
const PAY_BUTTON_HEIGHT = 44;

/** Centre du bouton « + » d'un produit de la grille. */
function addButtonOf(productIndex: number) {
  const column = productIndex % 2;
  const row = Math.floor(productIndex / 2);
  const cardX = PANELS_X + PRODUCTS_PADDING + column * (PRODUCT_CARD.width + PRODUCT_CARD.gap);
  const cardY = PANELS_Y + PANEL_HEADER_HEIGHT + PRODUCTS_PADDING + SEARCH_HEIGHT + SEARCH_MARGIN + row * (PRODUCT_CARD.height + PRODUCT_CARD.gap);
  return { x: cardX + PRODUCT_CARD.width - 28, y: cardY + PRODUCT_CARD.height / 2 };
}

const PAY_BUTTON = {
  x: CART_X + CART_WIDTH / 2,
  y:
    PANELS_Y +
    PANEL_HEADER_HEIGHT +
    SALE_LINES.length * CART_LINE_HEIGHT +
    CART_PADDING +
    FIELD_HEIGHT * 2 +
    FIELD_GAP * 3 +
    TOTALS_HEIGHT +
    PAY_BUTTON_HEIGHT / 2,
};

// Déroulé : deux clics sur le premier produit, un sur le second, puis l'encaissement.
const ADD_CLICKS = [
  { at: 1800, line: 0 },
  { at: 2350, line: 0 },
  { at: 3350, line: 1 },
];
const CLICK_PAY = 6600;
const CLICK_STOCK = 9700;

const CURSOR_PATH = [
  { at: 0, ...NEW_SALE_BUTTON },
  { at: 700, ...NEW_SALE_BUTTON },
  { at: 1650, ...addButtonOf(SALE_LINES[0].productIndex) },
  { at: 2500, ...addButtonOf(SALE_LINES[0].productIndex) },
  { at: 3200, ...addButtonOf(SALE_LINES[1].productIndex) },
  { at: 5500, ...addButtonOf(SALE_LINES[1].productIndex) },
  { at: 6400, ...PAY_BUTTON },
  { at: 8300, ...PAY_BUTTON },
  { at: 9500, ...STOCK_NAV_ITEM },
];

const CART_SHOT = { focusX: PANELS_X + (PRODUCTS_WIDTH + PANELS_GAP + CART_WIDTH) / 2, focusY: 480, scale: 1.3 };
const CAMERA = [
  { at: 0, ...WIDE_SHOT },
  { at: 3900, ...WIDE_SHOT },
  { at: 4800, ...CART_SHOT },
  { at: 7700, ...CART_SHOT },
  { at: 8600, ...WIDE_SHOT },
];

/** Nouvelle vente : le pointeur remplit le panier, le total suit, la vente est encaissée. */
export function SaleScene({ time }: SceneProps) {
  const camera = track(time, CAMERA);
  const paid = time >= CLICK_PAY;

  const lines = SALE_LINES.map((line, index) => {
    const clicks = ADD_CLICKS.filter((click) => click.line === index);
    const lastClick = clicks.findLast((click) => click.at <= time);
    return {
      product: PRODUCTS[line.productIndex],
      quantity: clicks.filter((click) => click.at <= time).length,
      addedAt: clicks[0].at,
      // Le compteur de quantité rebondit à chaque ajout.
      bump: lastClick ? 1 - clamp01((time - lastClick.at) / 260) : 0,
    };
  });
  const cart = paid ? [] : lines.filter((line) => line.quantity > 0);
  // Le total monte progressivement à chaque ajout plutôt que de sauter.
  const total = paid ? 0 : ADD_CLICKS.reduce((sum, click) => sum + PRODUCTS[SALE_LINES[click.line].productIndex].price * progress(time, click.at, 450), 0);
  const pressed = 1 - clamp01(Math.abs(time - CLICK_PAY) / 160);

  return (
    <div className="absolute inset-0">
      <Backdrop />

      <Shot camera={camera}>
        <AppWindow activeHref="/ventes" pageTitle="Ventes">
          <PageTitle title="Nouvelle vente" description="Ajoutez des produits au panier puis encaissez." />

          <div className="flex items-start" style={{ gap: PANELS_GAP }}>
            <Panel style={{ width: PRODUCTS_WIDTH, height: PANELS_HEIGHT }}>
              <PanelHeader title="Produits" description="Cliquez sur un produit pour l'ajouter au panier." />
              <div style={{ padding: PRODUCTS_PADDING }}>
                <p
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-3.5 text-sm text-slate-400 shadow-xs"
                  style={{ height: SEARCH_HEIGHT, marginBottom: SEARCH_MARGIN }}
                >
                  <Icon name="search" className="h-4 w-4" />
                  Rechercher un produit à ajouter…
                </p>
                <div className="grid" style={{ gap: PRODUCT_CARD.gap, gridTemplateColumns: `repeat(2, ${PRODUCT_CARD.width}px)` }}>
                  {PRODUCTS.map((product, index) => {
                    const sold = paid ? (lines.find((line) => line.product === product)?.quantity ?? 0) : 0;
                    const stock = product.stock - sold;
                    const justAdded = ADD_CLICKS.some((click) => SALE_LINES[click.line].productIndex === index && time >= click.at && time < click.at + 300);
                    return (
                      <div
                        key={product.name}
                        className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 ${
                          stock <= 0 ? "border-slate-200 bg-slate-50 opacity-60" : justAdded ? "border-brand-300 bg-brand-50" : "border-slate-200 bg-white shadow-xs"
                        }`}
                        style={{ height: PRODUCT_CARD.height }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-slate-900">{product.name}</span>
                          <span className="tabular mt-0.5 block truncate text-xs text-slate-500">
                            <span className="font-medium text-slate-700">{money(product.price)}</span>
                            {" · "}
                            {stock <= 0 ? <span className="font-medium text-red-600">Rupture</span> : `${stock} ${product.unit} en stock`}
                          </span>
                        </span>
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200">
                          <Icon name="plus" className="h-4 w-4" />
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Panel>

            <Panel style={{ width: CART_WIDTH, height: PANELS_HEIGHT }}>
              <PanelHeader title="Panier" description={cart.length === 0 ? "Aucun article" : `${cart.length} article(s)`} />

              <div className="relative" style={{ height: SALE_LINES.length * CART_LINE_HEIGHT }}>
                {cart.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <Icon name="cart" className="h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-sm font-medium text-slate-700">Panier vide</p>
                    <p className="text-xs text-slate-500">Ajoutez des produits pour commencer.</p>
                  </div>
                )}
                {cart.map((line) => (
                  <div
                    key={line.product.name}
                    className="flex items-center justify-between gap-3 border-b border-slate-100 px-5"
                    style={{ height: CART_LINE_HEIGHT, ...riseIn(time, line.addedAt, { duration: 350, distance: 14 }) }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{line.product.name}</span>
                      <span className="tabular block text-xs text-slate-500">
                        {money(line.product.price)} × {line.quantity} ={" "}
                        <span className="font-medium text-slate-700">{money(line.product.price * line.quantity)}</span>
                      </span>
                    </span>
                    <span className="tabular flex h-8 shrink-0 items-center rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-xs">
                      <span className="flex w-7 justify-center text-slate-400">
                        <Icon name="minus" className="h-3.5 w-3.5" />
                      </span>
                      <span className="flex h-full w-8 items-center justify-center border-x border-slate-200 font-medium">
                        <span style={{ transform: `scale(${1 + line.bump * 0.35})` }}>{line.quantity}</span>
                      </span>
                      <span className="flex w-7 justify-center text-slate-500">
                        <Icon name="plus" className="h-3.5 w-3.5" />
                      </span>
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-100" style={{ padding: CART_PADDING }}>
                <FakeField label="Client (optionnel)" value="Client de passage" />
                <div className="flex gap-3" style={{ marginTop: FIELD_GAP }}>
                  <FakeField label="Paiement" value="Espèces" />
                  <FakeField label="Remise" value="0" />
                </div>
                <dl
                  className="tabular flex flex-col justify-center gap-1.5 rounded-lg bg-slate-50 px-4 text-sm ring-1 ring-inset ring-slate-200/70"
                  style={{ height: TOTALS_HEIGHT, marginTop: FIELD_GAP }}
                >
                  <div className="flex justify-between text-slate-500">
                    <dt>Sous-total</dt>
                    <dd>{money(total)}</dd>
                  </div>
                  <div className="flex items-baseline justify-between border-t border-slate-200/80 pt-2 text-slate-900">
                    <dt className="font-medium">Total</dt>
                    <dd className="text-2xl font-semibold tracking-tight">{money(total)}</dd>
                  </div>
                </dl>
                <p
                  className="flex items-center justify-center rounded-lg bg-brand-600 text-sm font-medium text-white shadow-xs"
                  style={{
                    height: PAY_BUTTON_HEIGHT,
                    marginTop: FIELD_GAP,
                    opacity: cart.length === 0 ? 0.5 : 1,
                    transform: `scale(${1 - pressed * 0.04})`,
                  }}
                >
                  Encaisser la vente
                </p>
              </div>
            </Panel>
          </div>
        </AppWindow>

        <SaleToast time={time} start={CLICK_PAY + 250} end={CLICK_STOCK} />
        <Cursor time={time} path={CURSOR_PATH} clicks={[...ADD_CLICKS.map((click) => click.at), CLICK_PAY, CLICK_STOCK]} />
      </Shot>

      <Caption time={time} start={300} end={3900} eyebrow="Nouvelle vente" title="Encaissez" accent="en quelques clics" />
      <Caption time={time} start={4400} end={8000} eyebrow="Paiement" title="Espèces, carte, Mobile Money" accent="ou crédit client" />
    </div>
  );
}

function FakeField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex-1" style={{ height: FIELD_HEIGHT }}>
      <p className="mb-1.5 text-[13px] font-medium leading-5 text-slate-700">{label}</p>
      <p className="flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-xs">{value}</p>
    </div>
  );
}

/** Notification de l'application après l'encaissement, posée sous la liste des produits. */
function SaleToast({ time, start, end }: { time: number; start: number; end: number }) {
  if (time < start) return null;
  const enter = progress(time, start, 450, easeOutBack);
  const exit = progress(time, end - 300, 300);
  return (
    <div
      className="absolute flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white py-3.5 pl-4 pr-5 text-[15px] font-medium text-slate-800 shadow-popover"
      style={{
        left: PANELS_X + PRODUCTS_WIDTH - 330,
        top: PANELS_Y + PANELS_HEIGHT - 90,
        opacity: clamp01(enter) * (1 - exit),
        transform: `translateY(${mix(16, 0, enter)}px) scale(${mix(0.94, 1, enter)})`,
      }}
    >
      <Icon name="checkCircle" className="h-5 w-5 text-emerald-600" />
      Vente enregistrée avec succès
    </div>
  );
}
