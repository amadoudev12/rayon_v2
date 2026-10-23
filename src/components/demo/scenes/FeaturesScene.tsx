import { Icon } from "@/components/ui/Icon";
import { FEATURES } from "../data";
import { easeOutBack, linear, mix, progress, riseIn } from "../motion";
import { Backdrop, RisingWords, type SceneProps } from "../parts";

/** Vue d'ensemble : les modules de l'application apparaissent un à un, dans l'ordre du menu. */
export function FeaturesScene({ time }: SceneProps) {
  // Lent rapprochement pendant toute la scène, pour qu'elle ne soit jamais figée.
  const drift = progress(time, 0, 6600, linear);

  return (
    <div className="absolute inset-0">
      <Backdrop tone="dark" />

      <div className="absolute inset-0" style={{ transform: `scale(${mix(1, 1.035, drift)})` }}>
        <div className="absolute inset-x-0 top-[140px] flex flex-col items-center text-center">
          <p className="text-[22px] font-semibold text-brand-300" style={riseIn(time, 300, { distance: 14 })}>
            Fonctionnalités
          </p>
          <h2 className="mt-4 text-[68px] font-semibold leading-[1.1] tracking-tight text-white">
            <RisingWords time={time} start={400} text="Tout ce qu'il faut pour gérer" />
            <RisingWords time={time} start={750} text="une boutique" className="text-brand-300" />
          </h2>
        </div>

        <ul className="absolute left-[124px] top-[440px] grid w-[1672px] grid-cols-4 gap-6">
          {FEATURES.map((feature, index) => {
            const pop = progress(time, 1000 + index * 110, 650, easeOutBack);
            return (
              <li
                key={feature.title}
                className="h-[210px] rounded-2xl bg-white/[0.06] p-7 ring-1 ring-inset ring-white/10"
                style={{ opacity: Math.min(1, pop * 1.5), transform: `translateY(${mix(40, 0, pop)}px) scale(${mix(0.9, 1, pop)})` }}
              >
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-500/20 text-brand-300 ring-1 ring-inset ring-brand-400/30">
                  <Icon name={feature.icon} className="h-7 w-7" />
                </span>
                <p className="mt-6 text-[26px] font-semibold tracking-tight text-white">{feature.title}</p>
                <p className="mt-1.5 text-[19px] leading-snug text-slate-300">{feature.text}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
