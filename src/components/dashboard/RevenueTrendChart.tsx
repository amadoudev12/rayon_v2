import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { formatMoney } from "@/lib/format";

type Point = { day: string; value: number; count: number };

export function RevenueTrendChart({ data, currency }: { data: Point[]; currency: string }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 12, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#94a3b8" }} />
        <YAxis tickLine={false} axisLine={false} width={0} tick={false} />
        <Tooltip
          cursor={{ stroke: "#cbd5e1", strokeDasharray: "3 3" }}
          content={({ active, payload }) => {
            if (!active || !payload?.length) return null;
            const point = payload[0].payload as Point;
            return (
              <div className="rounded-lg border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-popover">
                <p className="font-medium capitalize text-slate-900">{point.day}</p>
                <p className="tabular mt-0.5 font-semibold text-slate-900">{formatMoney(point.value, currency)}</p>
                <p className="text-slate-500">{point.count} vente(s)</p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="#4f46e5"
          strokeWidth={2}
          fill="url(#revenueFill)"
          activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
