import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { CtaLink, REGISTER_HREF } from "@/components/landing/parts";
import { Icon } from "@/components/ui/Icon";
import { Link, useSearchParams } from "@/lib/navigation";
import { clamp01, easeInOut, progress } from "./motion";
import { STAGE_HEIGHT, STAGE_WIDTH } from "./parts";
import { DEMO_DURATION, SCENE_FADE, SCENES } from "./timeline";

declare global {
  interface Window {
    /** Commande de la démonstration pour l'export vidéo (`demo-video/export.mjs`). */
    __rayonDemo?: { duration: number; seek: (time: number) => void };
  }
}

const CONTROL_BUTTON =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400";

/** Horloge de la démonstration : le temps courant en millisecondes, la lecture et le déplacement. */
function useDemoClock(autoPlay: boolean) {
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);
  // Le temps est aussi gardé dans une référence : la boucle de lecture le lit sans redémarrer à chaque image.
  const timeRef = useRef(0);

  const seek = useCallback((next: number) => {
    timeRef.current = clamp01(next / DEMO_DURATION) * DEMO_DURATION;
    setTime(timeRef.current);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    let previous = performance.now();

    const tick = (now: number) => {
      const next = timeRef.current + (now - previous);
      previous = now;
      seek(next);
      if (next >= DEMO_DURATION) setPlaying(false);
      else frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing, seek]);

  const toggle = useCallback(() => {
    // Arrivée à la fin, la lecture reprend du début.
    if (timeRef.current >= DEMO_DURATION) seek(0);
    setPlaying((value) => !value);
  }, [seek]);

  return { time, playing, seek, toggle, pause: () => setPlaying(false) };
}

/** Échelle qui fait tenir la scène (1920 × 1080) dans l'élément observé. */
function useFitScale() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setScale(Math.min(width / STAGE_WIDTH, height / STAGE_HEIGHT));
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { containerRef, scale };
}

function formatClock(milliseconds: number) {
  const seconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

/**
 * Lecteur de la démonstration. Avec `?export=1`, il n'affiche que la scène,
 * à l'arrêt, et laisse le script d'export choisir l'instant affiché.
 */
export function DemoPlayer() {
  const exportMode = useSearchParams().get("export") === "1";
  const [autoPlay] = useState(() => !exportMode && !window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const { time, playing, seek, toggle, pause } = useDemoClock(autoPlay);
  const { containerRef, scale } = useFitScale();

  useEffect(() => {
    if (!exportMode) return;
    // `flushSync` : l'image est à jour dès le retour de `seek`, avant la capture.
    window.__rayonDemo = { duration: DEMO_DURATION, seek: (next) => flushSync(() => seek(next)) };
    return () => {
      delete window.__rayonDemo;
    };
  }, [exportMode, seek]);

  useEffect(() => {
    if (exportMode) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLButtonElement) return;
      if (event.key === " ") {
        event.preventDefault();
        toggle();
      }
      if (event.key === "ArrowRight") seek(time + 2000);
      if (event.key === "ArrowLeft") seek(time - 2000);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exportMode, seek, time, toggle]);

  const finished = time >= DEMO_DURATION;
  const currentScene = SCENES.findLast((scene) => time >= scene.start) ?? SCENES[0];

  return (
    <div className="fixed inset-0 flex flex-col bg-slate-950">
      <div ref={containerRef} className="flex min-h-0 flex-1 items-center justify-center">
        <div className="relative overflow-hidden" style={{ width: STAGE_WIDTH * scale, height: STAGE_HEIGHT * scale }}>
          <div
            aria-hidden
            className="absolute left-0 top-0 select-none overflow-hidden"
            style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT, transformOrigin: "0 0", transform: `scale(${scale})` }}
          >
            {SCENES.map((scene, index) => {
              const sceneTime = time - scene.start;
              // Une scène reste affichée sous la suivante le temps du fondu.
              if (sceneTime < 0 || sceneTime > scene.duration + SCENE_FADE) return null;
              return (
                <div key={scene.id} className="absolute inset-0" style={{ opacity: index === 0 ? 1 : progress(sceneTime, 0, SCENE_FADE, easeInOut) }}>
                  <scene.Component time={sceneTime} />
                </div>
              );
            })}
          </div>

          {finished && !exportMode && (
            <div className="absolute inset-x-0 bottom-[8%] flex animate-fade-in flex-wrap items-center justify-center gap-3 px-4">
              <CtaLink href={REGISTER_HREF} size="lg">
                Créer un compte
                <Icon name="arrowRight" className="h-4 w-4" />
              </CtaLink>
              <button
                type="button"
                onClick={toggle}
                className="inline-flex h-11 items-center gap-2 rounded-lg border border-white/20 px-5 text-[15px] font-medium text-white transition-colors hover:border-white/40 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <Icon name="history" className="h-4 w-4" />
                Revoir la démonstration
              </button>
            </div>
          )}
        </div>
      </div>

      {!exportMode && (
        <div className="flex h-14 shrink-0 items-center gap-2 border-t border-white/10 px-3 sm:gap-3 sm:px-4">
          <button type="button" onClick={toggle} aria-label={playing ? "Mettre en pause" : "Lire"} className={CONTROL_BUTTON}>
            <Icon name={playing ? "pause" : "play"} className="h-5 w-5" />
          </button>
          <span className="tabular shrink-0 text-xs text-slate-400">
            {formatClock(time)} / {formatClock(DEMO_DURATION)}
          </span>
          <input
            type="range"
            aria-label="Position dans la démonstration"
            min={0}
            max={DEMO_DURATION}
            step={10}
            value={time}
            onChange={(event) => {
              pause();
              seek(Number(event.target.value));
            }}
            className="h-1 min-w-0 flex-1 cursor-pointer accent-brand-500"
          />
          <span className="hidden w-32 shrink-0 truncate text-right text-xs text-slate-400 md:block">{currentScene.label}</span>
          <button
            type="button"
            onClick={() => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen())}
            aria-label="Plein écran"
            className={CONTROL_BUTTON}
          >
            <Icon name="maximize" className="h-4 w-4" />
          </button>
          <Link
            href="/"
            className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
          >
            Quitter
          </Link>
        </div>
      )}
    </div>
  );
}
