/**
 * Outils d'animation de la démonstration.
 *
 * Aucune animation CSS ici : chaque valeur (position, opacité, zoom…) est
 * calculée à partir du temps écoulé, en millisecondes. Une même image
 * correspond donc toujours au même instant, ce qui permet de lire la
 * démonstration dans le navigateur et de l'exporter en vidéo image par image.
 */

export type Easing = (t: number) => number;

export const linear: Easing = (t) => t;
/** Départ rapide, arrivée douce : entrées d'éléments. */
export const easeOut: Easing = (t) => 1 - (1 - t) ** 4;
/** Départ et arrivée doux : mouvements de caméra et du pointeur. */
export const easeInOut: Easing = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
/** Dépasse légèrement la valeur finale avant de s'y poser : apparition du logo, des cartes. */
export const easeOutBack: Easing = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function mix(from: number, to: number, t: number) {
  return from + (to - from) * t;
}

/** Avancement, de 0 à 1, d'une animation qui commence à `start` et dure `duration`. */
export function progress(time: number, start: number, duration: number, ease: Easing = easeOut) {
  return ease(clamp01((time - start) / duration));
}

/**
 * Valeur d'une piste d'images clés à l'instant `time`. Entre deux images
 * clés, chaque nombre est interpolé ; deux images clés identiques à la suite
 * maintiennent la valeur.
 */
export function track<T extends Record<string, number>>(time: number, keyframes: (T & { at: number })[], ease: Easing = easeInOut): T {
  const nextIndex = keyframes.findIndex((keyframe) => keyframe.at > time);
  if (nextIndex === 0) return keyframes[0];
  if (nextIndex === -1) return keyframes[keyframes.length - 1];

  const from = keyframes[nextIndex - 1];
  const to = keyframes[nextIndex];
  const t = ease((time - from.at) / (to.at - from.at));
  return Object.fromEntries(Object.keys(from).map((key) => [key, mix(from[key], to[key], t)])) as T;
}

/** Style d'un élément qui apparaît en glissant vers le haut. */
export function riseIn(time: number, start: number, { duration = 600, distance = 24 } = {}) {
  const t = progress(time, start, duration);
  return { opacity: t, transform: `translateY(${mix(distance, 0, t)}px)` };
}
