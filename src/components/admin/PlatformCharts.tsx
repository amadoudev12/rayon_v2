import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AXIS_TICK = { fontSize: 12, fill: "#94a3b8" };
const TOOLTIP_BOX = "rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-popover";

type CountPoint = { day: string; count: number };

/** Nombre de ventes par jour (ou par heure) — même langage visuel que `RevenueTrendChart`. */
export function SalesCountChart({ data }: { data: CountPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={0} tick={false} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "#f8fafc" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as CountPoint;
            return (
              <div className={TOOLTIP_BOX}>
                <p className="font-medium capitalize text-slate-900">{point.day}</p>
                <p className="tabular mt-0.5 font-semibold text-slate-900">{point.count} vente(s)</p>
              </div>
            );
          }}
        />
        <Bar dataKey="count" fill="#4f46e5" radius={[3, 3, 0, 0]} maxBarSize={28} />
      </BarChart>
    </ResponsiveContainer>
  );
}

type SignupPoint = { week: string; organizations: number; users: number };

/** Nouvelles boutiques et nouveaux utilisateurs par semaine. */
export function SignupsChart({ data }: { data: SignupPoint[] }) {
  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="week" tickLine={false} axisLine={false} tick={AXIS_TICK} minTickGap={16} />
          <YAxis tickLine={false} axisLine={false} width={0} tick={false} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: "#f8fafc" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as SignupPoint;
              return (
                <div className={TOOLTIP_BOX}>
                  <p className="font-medium text-slate-900">Semaine du {point.week}</p>
                  <p className="tabular mt-0.5 text-slate-700">{point.organizations} boutique(s)</p>
                  <p className="tabular text-slate-700">{point.users} utilisateur(s)</p>
                </div>
              );
            }}
          />
          <Bar dataKey="organizations" fill="#4f46e5" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="users" fill="#cbd5e1" radius={[3, 3, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex items-center justify-center gap-5 pb-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-brand-600" aria-hidden />
          Boutiques
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-sm bg-slate-300" aria-hidden />
          Utilisateurs
        </span>
      </div>
    </div>
  );
}
