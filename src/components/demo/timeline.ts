import type { SceneProps } from "./parts";
import { DashboardScene } from "./scenes/DashboardScene";
import { FeaturesScene } from "./scenes/FeaturesScene";
import { IntroScene } from "./scenes/IntroScene";
import { OutroScene } from "./scenes/OutroScene";
import { SaleScene } from "./scenes/SaleScene";
import { StockScene } from "./scenes/StockScene";

/**
 * Scénario de la démonstration : les scènes dans l'ordre, avec leur durée en
 * millisecondes. Pour réordonner, raccourcir ou retirer une scène, c'est ici.
 * Le minutage interne d'une scène (textes, caméra, clics) est dans son fichier.
 */
const STORYBOARD: { id: string; label: string; duration: number; Component: (props: SceneProps) => React.ReactNode }[] = [
  { id: "intro", label: "Ouverture", duration: 4400, Component: IntroScene },
  { id: "dashboard", label: "Tableau de bord", duration: 8800, Component: DashboardScene },
  { id: "sale", label: "Nouvelle vente", duration: 10200, Component: SaleScene },
  { id: "stock", label: "Stock", duration: 8000, Component: StockScene },
  { id: "features", label: "Fonctionnalités", duration: 6000, Component: FeaturesScene },
  { id: "outro", label: "Conclusion", duration: 5200, Component: OutroScene },
];

/** Durée du fondu d'une scène sur la précédente. */
export const SCENE_FADE = 600;

/** Scènes avec leur instant de début. */
export const SCENES = STORYBOARD.map((scene, index) => ({
  ...scene,
  start: STORYBOARD.slice(0, index).reduce((total, previous) => total + previous.duration, 0),
}));

export const DEMO_DURATION = STORYBOARD.reduce((total, scene) => total + scene.duration, 0);
