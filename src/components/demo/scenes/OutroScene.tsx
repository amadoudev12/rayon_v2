import { Icon } from "@/components/ui/Icon";
import { easeOutBack, mix, progress, riseIn } from "../motion";
import { Backdrop, BrandMark, RisingWords, type SceneProps } from "../parts";

/** Conclusion : le logo revient, avec l'appel à l'action de la page d'accueil. */
export function OutroScene({ time }: SceneProps) {
  const pop = progress(time, 300, 800, easeOutBack);
  const button = progress(time, 2300, 700, easeOutBack);

  return (
    <div className="absolute inset-0">
      <Backdrop tone="dark" />

      <div className="absolute inset-x-0 top-[280px] flex flex-col items-center text-center">
        <div className="flex items-center gap-6" style={{ opacity: Math.min(1, pop * 2), transform: `scale(${pop})` }}>
          <BrandMark size={92} />
          <p className="text-[76px] font-semibold leading-none tracking-tight text-white">Rayon</p>
        </div>

        <h2 className="mt-16 text-[84px] font-semibold leading-[1.08] tracking-tight text-white">
          <RisingWords time={time} start={900} text={"Prêt à mieux gérer votre magasin ?"} />
        </h2>
        <p className="mt-7 max-w-[1300px] text-[30px] leading-normal text-slate-300" style={riseIn(time, 1700)}>
          Créez votre compte, configurez votre boutique et enregistrez votre première vente.
        </p>

        <p
          className="mt-14 inline-flex h-[76px] items-center gap-4 rounded-2xl bg-white px-10 text-[28px] font-semibold text-slate-900 shadow-[0_20px_60px_-15px_rgb(99_102_241/0.8)]"
          style={{ opacity: Math.min(1, button * 1.5), transform: `translateY(${mix(30, 0, button)}px) scale(${mix(0.9, 1, button)})` }}
        >
          Créer un compte
          <Icon name="arrowRight" className="h-7 w-7" />
        </p>
      </div>
    </div>
  );
}
