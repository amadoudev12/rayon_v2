import { useState } from "react";
import { Icon } from "@/components/ui/Icon";

type PreviewTab = {
  id: string;
  label: string;
  icon: string;
  /** Phrase affichée sous les onglets pour situer l'écran. */
  caption: string;
  content: React.ReactNode;
};

/** Onglets de la section « Aperçu » : un écran de l'application par onglet. */
export function PreviewTabs({ tabs }: { tabs: PreviewTab[] }) {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0];

  return (
    <div>
      <div role="tablist" aria-label="Écrans de l'application" className="scrollbar-thin flex justify-start gap-1.5 overflow-x-auto pb-1 sm:justify-center">
        {tabs.map((tab) => {
          const selected = tab.id === active.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`preview-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`preview-panel-${tab.id}`}
              onClick={() => setActiveId(tab.id)}
              className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50 ${
                selected
                  ? "bg-white text-slate-900 shadow-xs ring-1 ring-slate-200"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
              }`}
            >
              <Icon name={tab.icon} className={`h-4 w-4 ${selected ? "text-brand-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <p className="mx-auto mt-4 max-w-xl text-center text-sm text-slate-500">{active.caption}</p>

      <div
        key={active.id}
        role="tabpanel"
        id={`preview-panel-${active.id}`}
        aria-labelledby={`preview-tab-${active.id}`}
        className="mt-6 animate-slide-up"
      >
        {active.content}
      </div>
    </div>
  );
}
