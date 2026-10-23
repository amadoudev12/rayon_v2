import { easeInOut, easeOutBack, mix, progress, riseIn } from "../motion";
import { Backdrop, BrandMark, RisingWords, type SceneProps } from "../parts";

/** Ouverture : le logo apparaît, le nom se déploie, puis la promesse de l'application s'écrit. */
export function IntroScene({ time }: SceneProps) {
  const pop = progress(time, 150, 800, easeOutBack);
  const wordmark = progress(time, 650, 800);
  const lift = progress(time, 1500, 900, easeInOut);

  return (
    <div className="absolute inset-0">
      <Backdrop />

      <div
        className="absolute inset-x-0 top-[474px] flex items-center justify-center"
        style={{ transform: `translateY(${mix(0, -170, lift)}px) scale(${mix(1, 0.62, lift)})` }}
      >
        <div style={{ opacity: Math.min(1, pop * 2), transform: `scale(${pop})` }}>
          <BrandMark size={132} />
        </div>
        <div className="overflow-hidden" style={{ maxWidth: mix(0, 420, wordmark), opacity: wordmark }}>
          <p className="pl-8 text-[116px] font-semibold leading-none tracking-tight text-slate-900">Rayon</p>
        </div>
      </div>

      <div className="absolute inset-x-0 top-[470px] flex flex-col items-center text-center">
        <p
          className="inline-flex items-center gap-2.5 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[19px] font-medium text-slate-600 shadow-xs"
          style={riseIn(time, 1800, { distance: 14 })}
        >
          <span className="h-2 w-2 rounded-full bg-brand-500" />
          Application web de gestion de magasin
        </p>
        <h1 className="mt-7 text-[76px] font-semibold leading-[1.08] tracking-tight text-slate-900">
          <RisingWords time={time} start={1950} text="Vos produits, votre stock et vos ventes," />
          <br />
          <RisingWords time={time} start={2500} text="au même endroit" className="text-brand-600" />
        </h1>
      </div>
    </div>
  );
}
