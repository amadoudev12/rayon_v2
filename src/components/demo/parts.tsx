import { NAV_ITEMS, NAV_SECTIONS } from "@/components/layout/navigation";
import { Icon } from "@/components/ui/Icon";
import { clamp01, easeInOut, easeOut, mix, progress, riseIn } from "./motion";

/**
 * Éléments communs aux scènes de la démonstration. La scène est dessinée sur
 * un plan fixe de 1920 × 1080 px (mis à l'échelle par le lecteur) : toutes les
 * positions ci-dessous sont exprimées dans ce repère.
 */

export const STAGE_WIDTH = 1920;
export const STAGE_HEIGHT = 1080;

/** Toute scène reçoit le temps écoulé depuis son début, en millisecondes. */
export type SceneProps = { time: number };

// ---------------------------------------------------------------------------
// Arrière-plan et textes
// ---------------------------------------------------------------------------

/** Fond d'une scène : la trame et le halo de la page d'accueil, en clair ou en sombre. */
export function Backdrop({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  return (
    <div className={`absolute inset-0 ${dark ? "bg-slate-900" : "bg-canvas"}`}>
      <div
        className={`absolute inset-0 bg-size-[64px_64px] mask-[radial-gradient(ellipse_at_top,black_10%,transparent_70%)] ${
          dark
            ? "bg-[linear-gradient(to_right,rgb(255_255_255/0.07)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.07)_1px,transparent_1px)]"
            : "bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] opacity-70"
        }`}
      />
      <div
        className={`absolute left-1/2 top-[-160px] h-[520px] w-[1300px] -translate-x-1/2 rounded-full blur-[120px] ${
          dark ? "bg-brand-500/30" : "bg-brand-200/50"
        }`}
      />
    </div>
  );
}

/** Mots qui montent un à un depuis une ligne de masque. */
export function RisingWords({ time, start, text, className = "" }: { time: number; start: number; text: string; className?: string }) {
  return (
    <>
      {text.split(" ").map((word, index) => {
        const t = progress(time, start + index * 70, 700);
        return (
          <span key={index} className="-mb-[0.14em] inline-block overflow-hidden whitespace-pre pb-[0.14em] align-bottom">
            <span className={`inline-block ${className}`} style={{ opacity: t, transform: `translateY(${mix(105, 0, t)}%)` }}>
              {word}{" "}
            </span>
          </span>
        );
      })}
    </>
  );
}

/** Titre affiché au-dessus de la fenêtre entre `start` et `end` : sur-titre, phrase, et sa fin mise en couleur. */
export function Caption({
  time,
  start,
  end,
  eyebrow,
  title,
  accent,
}: {
  time: number;
  start: number;
  end: number;
  eyebrow: string;
  title: string;
  accent?: string;
}) {
  if (time < start || time > end) return null;
  const exit = progress(time, end - 450, 450, easeInOut);
  const accentStart = start + 120 + title.split(" ").length * 70;

  return (
    <div
      className="absolute inset-x-0 top-[58px] flex flex-col items-center text-center"
      style={{ opacity: 1 - exit, transform: `translateY(${-20 * exit}px)` }}
    >
      <p
        className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[19px] font-medium text-slate-600 shadow-xs"
        style={riseIn(time, start, { distance: 14 })}
      >
        <span className="h-2 w-2 rounded-full bg-brand-500" />
        {eyebrow}
      </p>
      <p className="mt-5 text-[62px] font-semibold leading-[1.1] tracking-tight text-slate-900">
        <RisingWords time={time} start={start + 120} text={title} />
        {accent && <RisingWords time={time} start={accentStart} text={accent} className="text-brand-600" />}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Fenêtre de l'application
// ---------------------------------------------------------------------------

export const WINDOW_WIDTH = 1480;
export const WINDOW_HEIGHT = 800;
const TITLE_BAR_HEIGHT = 40;
const SIDEBAR_WIDTH = 230;
const HEADER_HEIGHT = 56;
/** Coin haut gauche de la zone de page, dans le repère de la fenêtre. */
export const PAGE_ORIGIN = { x: SIDEBAR_WIDTH, y: TITLE_BAR_HEIGHT + HEADER_HEIGHT };
export const PAGE_PADDING = 28;

/** Cibles du pointeur dans la barre latérale (repère de la fenêtre). Elles découlent des hauteurs fixées dans `AppWindow`. */
export const NEW_SALE_BUTTON = { x: 115, y: 133 };
export const STOCK_NAV_ITEM = { x: 76, y: 315 };

/** Fenêtre de l'application : barre latérale et en-tête du vrai cadre (`AppShell`), à taille fixe. */
export function AppWindow({ activeHref, pageTitle, children }: { activeHref: string; pageTitle: string; children: React.ReactNode }) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_50px_120px_-40px_rgb(15_23_42/0.35),0_20px_50px_-25px_rgb(15_23_42/0.2)]"
      style={{ width: WINDOW_WIDTH, height: WINDOW_HEIGHT }}
    >
      <div className="flex items-center gap-2 border-b border-slate-200/80 bg-slate-50 px-4" style={{ height: TITLE_BAR_HEIGHT }}>
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
        <span className="h-3 w-3 rounded-full bg-slate-300" />
      </div>

      <div className="flex" style={{ height: WINDOW_HEIGHT - TITLE_BAR_HEIGHT }}>
        <aside className="shrink-0 border-r border-slate-200/80 bg-white" style={{ width: SIDEBAR_WIDTH }}>
          <div className="flex h-[60px] items-center gap-2.5 border-b border-slate-100 px-3.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">B</span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold leading-tight text-slate-900">Boutique Démo</span>
              <span className="block text-xs leading-tight text-slate-500">Gestion de magasin</span>
            </span>
          </div>
          <div className="px-3.5 pt-3.5">
            <span className="flex h-[38px] items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white shadow-xs">
              <Icon name="plus" className="h-4 w-4" />
              Nouvelle vente
            </span>
          </div>
          <div className="px-3.5 pt-4">
            {NAV_SECTIONS.map((section) => (
              <div key={section} className="mb-3.5">
                <p className="flex h-6 items-start px-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">{section}</p>
                {NAV_ITEMS.filter((item) => item.section === section).map((item) => {
                  const active = item.href === activeHref;
                  return (
                    <span
                      key={item.href}
                      className={`flex h-[34px] items-center gap-2.5 rounded-lg px-2 text-sm font-medium ${
                        active ? "bg-slate-100 text-slate-900" : "text-slate-600"
                      }`}
                    >
                      <Icon name={item.icon} className={`h-4 w-4 ${active ? "text-brand-600" : "text-slate-400"}`} />
                      {item.label}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between border-b border-slate-200/80 px-7" style={{ height: HEADER_HEIGHT }}>
            <span className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Boutique Démo</span>
              <Icon name="chevronRight" className="h-3.5 w-3.5 text-slate-300" />
              <span className="font-medium text-slate-900">{pageTitle}</span>
            </span>
            <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">DD</span>
              Demo
            </span>
          </div>
          <div className="relative bg-canvas" style={{ height: WINDOW_HEIGHT - TITLE_BAR_HEIGHT - HEADER_HEIGHT, padding: PAGE_PADDING }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Panel({ children, className = "", style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`rounded-xl border border-slate-200/80 bg-white shadow-card ${className}`} style={style}>
      {children}
    </div>
  );
}

export const PANEL_HEADER_HEIGHT = 72;

export function PanelHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col justify-center border-b border-slate-100 px-5" style={{ height: PANEL_HEADER_HEIGHT }}>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-0.5 text-[13px] text-slate-500">{description}</p>}
    </div>
  );
}

/** Logo de Rayon : le pictogramme de l'icône du site, à la taille voulue. */
export function BrandMark({ size }: { size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center bg-brand-600 shadow-[0_20px_50px_-15px_rgb(79_70_229/0.7)] ring-1 ring-inset ring-white/15"
      style={{ width: size, height: size, borderRadius: size * 0.25 }}
    >
      <svg width={size * 0.52} height={size * 0.52} viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6" />
      </svg>
    </span>
  );
}

export const PAGE_TITLE_HEIGHT = 76;

export function PageTitle({ title, description }: { title: string; description: string }) {
  return (
    <div style={{ height: PAGE_TITLE_HEIGHT }}>
      <p className="text-xl font-semibold tracking-tight text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Caméra et pointeur
// ---------------------------------------------------------------------------

/** Cadrage de la fenêtre : le point visé (repère de la fenêtre) et le zoom. */
export type Camera = { focusX: number; focusY: number; scale: number };

/** Plan large : la fenêtre entière. */
export const WIDE_SHOT: Camera = { focusX: WINDOW_WIDTH / 2, focusY: WINDOW_HEIGHT / 2, scale: 1 };

/** Endroit de la scène où la caméra amène le point visé : le centre, sous le titre. */
const CAMERA_ANCHOR = { x: STAGE_WIDTH / 2, y: 630 };

/**
 * Place la fenêtre dans la scène selon la caméra. `entrance` (0 → 1) joue
 * l'arrivée de la fenêtre : elle se redresse et remonte.
 */
export function Shot({ camera, entrance = 1, children }: { camera: Camera; entrance?: number; children: React.ReactNode }) {
  const x = CAMERA_ANCHOR.x - camera.focusX * camera.scale;
  const y = CAMERA_ANCHOR.y - camera.focusY * camera.scale;
  // En gros plan, la fenêtre passe sous le titre : un voile garde le texte lisible.
  const veil = clamp01((camera.scale - 1) / 0.2);

  return (
    <>
      <div className="absolute left-0 top-0" style={{ transformOrigin: "0 0", transform: `translate(${x}px, ${y}px) scale(${camera.scale})` }}>
        <div
          style={{
            opacity: clamp01(entrance * 1.6),
            transformOrigin: "50% 100%",
            transform: `perspective(2200px) translateY(${mix(140, 0, entrance)}px) rotateX(${mix(16, 0, entrance)}deg) scale(${mix(0.92, 1, entrance)})`,
          }}
        >
          {children}
        </div>
      </div>
      <div className="absolute inset-x-0 top-0 h-[340px] bg-linear-to-b from-canvas from-70% to-transparent" style={{ opacity: veil }} />
    </>
  );
}

/** Anneau de mise en évidence autour d'une zone de la fenêtre, visible entre `start` et `end`. */
export function Highlight({
  time,
  start,
  end,
  x,
  y,
  width,
  height,
}: {
  time: number;
  start: number;
  end: number;
  x: number;
  y: number;
  width: number;
  height: number;
}) {
  const visible = progress(time, start, 400) * (1 - progress(time, end - 300, 300, easeInOut));
  if (visible <= 0) return null;
  const grow = mix(10, 0, progress(time, start, 500));
  return (
    <div
      className="absolute rounded-2xl ring-2 ring-brand-500 shadow-[0_0_0_8px_rgb(99_102_241/0.14)]"
      style={{ left: x - 6 - grow, top: y - 6 - grow, width: width + 12 + grow * 2, height: height + 12 + grow * 2, opacity: visible }}
    />
  );
}

type CursorKeyframe = { at: number; x: number; y: number };

/** Pointeur de souris : suit ses images clés et marque chaque clic d'une onde. */
export function Cursor({ time, path, clicks }: { time: number; path: CursorKeyframe[]; clicks: number[] }) {
  if (time < path[0].at) return null;

  const nextIndex = path.findIndex((keyframe) => keyframe.at > time);
  const from = path[nextIndex === -1 ? path.length - 1 : Math.max(0, nextIndex - 1)];
  const to = nextIndex === -1 ? from : path[nextIndex];
  const t = to === from ? 1 : easeInOut((time - from.at) / (to.at - from.at));
  const x = mix(from.x, to.x, t);
  const y = mix(from.y, to.y, t);

  // Le pointeur s'enfonce brièvement au moment du clic.
  const press = clicks.reduce((strongest, click) => Math.max(strongest, 1 - clamp01(Math.abs(time - click) / 140)), 0);

  return (
    <div className="absolute left-0 top-0" style={{ transform: `translate(${x}px, ${y}px)`, opacity: progress(time, path[0].at, 300) }}>
      {clicks.map((click) => {
        const wave = progress(time, click, 500, easeOut);
        if (time < click || wave >= 1) return null;
        return (
          <span
            key={click}
            className="absolute -left-6 -top-6 h-12 w-12 rounded-full border-2 border-brand-500 bg-brand-500/15"
            style={{ opacity: 1 - wave, transform: `scale(${mix(0.3, 1.2, wave)})` }}
          />
        );
      })}
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        className="absolute left-0 top-0 drop-shadow-[0_3px_5px_rgb(15_23_42/0.35)]"
        style={{ transformOrigin: "0 0", transform: `scale(${1 - press * 0.14})` }}
      >
        <path d="M4 2.5l15.5 8.2-6.6 1.8-2.6 6.6L4 2.5z" fill="#0f172a" stroke="#ffffff" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
