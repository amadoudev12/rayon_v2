import { useLoaderData } from "react-router";
import { Link } from "@/lib/navigation";
import { loadPage } from "@/lib/api";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatCard } from "@/components/dashboard/StatCard";
import { RevenueTrendChart } from "@/components/dashboard/RevenueTrendChart";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { LinkButton } from "@/components/ui/Button";
import { formatMoney, formatNumber, formatDate, formatDateTime } from "@/lib/format";

/** Chiffres du tableau de bord, calculés par le backend (`getDashboardStats`). */
type DashboardStats = {
  period: { start: string; previousStart: string; previousEnd: string };
  revenue: number;
  previousRevenue: number;
  /** Variation en % par rapport à la même période du mois précédent ; null si rien à comparer. */
  revenueChange: number | null;
  salesCount: number;
  averageBasket: number;
  todayRevenue: number;
  todaySalesCount: number;
  costOfGoodsSold: number;
  grossMargin: number;
  /** Taux de marge en % du chiffre d'affaires ; null sans ventes. */
  grossMarginRate: number | null;
  expensesTotal: number;
  netProfit: number;
  activeProductsCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  lowStock: {
    productId: number;
    productName: string;
    unit: string;
    storeId: number;
    storeName: string;
    quantity: number;
    alertThreshold: number;
  }[];
  topProducts: { productId: number; productName: string; unit: string; quantity: number; amount: number }[];
  trend: { day: string; value: number; count: number }[];
  recentActivity: {
    type: "sale" | "expense";
    id: number;
    label: string;
    subtitle: string;
    amount: number;
    cancelled: boolean;
    createdAt: string;
  }[];
};

type DashboardPageData = {
  currency: string;
  storeName: string;
  stats: DashboardStats;
  totalProducts: number;
  totalSales: number;
};

export function loader() {
  return loadPage<DashboardPageData>("/dashboard");
}

function formatPercent(value: number) {
  return `${value > 0 ? "+" : ""}${value.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
}

export default function DashboardPage() {
  const { currency, storeName, stats, totalProducts, totalSales } = useLoaderData<DashboardPageData>();

  const isNewShop = totalProducts === 0 || totalSales === 0;
  const monthLabel = formatDate(stats.period.start, { month: "long", year: "numeric" });
  const previousMonthLabel = formatDate(stats.period.previousStart, { month: "long" });

  return (
    <div>
      <PageHeader title="Tableau de bord" description={`${storeName} · ${monthLabel}`} />

      {isNewShop && (
        <Card className="mb-6 p-5">
          <div className="flex items-center gap-2">
            <Icon name="sparkles" className="h-4 w-4 text-brand-600" />
            <p className="text-sm font-semibold text-slate-900">Pour bien démarrer</p>
          </div>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { done: totalProducts > 0, label: "Ajoutez vos produits", href: "/produits", cta: "Aller aux produits" },
              { done: totalSales > 0, label: "Enregistrez votre première vente", href: "/ventes/nouvelle", cta: "Nouvelle vente" },
            ].map((task) => (
              <li
                key={task.href}
                className="flex items-center justify-between gap-3 rounded-lg border border-slate-200/80 bg-slate-50/50 px-3.5 py-3"
              >
                <span className="flex items-center gap-2.5 text-sm text-slate-700">
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      task.done ? "bg-emerald-500 text-white" : "bg-white ring-1 ring-slate-300"
                    }`}
                  >
                    {task.done && <Icon name="check" className="h-3 w-3" />}
                  </span>
                  <span className={task.done ? "text-slate-500 line-through" : ""}>{task.label}</span>
                </span>
                {!task.done && (
                  <LinkButton href={task.href} size="sm" variant="secondary">
                    {task.cta}
                  </LinkButton>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Résultat du mois : du chiffre d'affaires jusqu'au bénéfice net. */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Chiffre d'affaires du mois"
          icon="chart"
          value={formatMoney(stats.revenue, currency)}
          hint={
            stats.revenueChange === null ? (
              `Aucune vente sur la même période en ${previousMonthLabel}`
            ) : (
              <>
                <span className={stats.revenueChange >= 0 ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                  {formatPercent(stats.revenueChange)}
                </span>{" "}
                vs même période en {previousMonthLabel}
              </>
            )
          }
        />
        <StatCard
          label="Marge brute"
          icon="trendingUp"
          value={formatMoney(stats.grossMargin, currency)}
          tone={stats.grossMargin < 0 ? "danger" : "default"}
          hint={
            stats.grossMarginRate === null
              ? "Chiffre d'affaires − coût d'achat des articles vendus"
              : `${stats.grossMarginRate.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} % du chiffre d'affaires`
          }
        />
        <StatCard
          label="Dépenses du mois"
          icon="wallet"
          value={formatMoney(stats.expensesTotal, currency)}
          tone={stats.expensesTotal > 0 ? "danger" : "default"}
          hint="Boutique + charges générales"
        />
        <StatCard
          label="Bénéfice net"
          icon="coins"
          value={formatMoney(stats.netProfit, currency)}
          tone={stats.netProfit >= 0 ? "success" : "danger"}
          hint="Marge brute − dépenses"
        />
      </div>

      {/* Activité : volume de ventes et état du stock. */}
      <div className="mt-3 grid grid-cols-2 gap-3 sm:mt-4 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Aujourd'hui"
          icon="calendar"
          value={formatMoney(stats.todayRevenue, currency)}
          hint={`${stats.todaySalesCount} vente(s)`}
        />
        <StatCard
          label="Ventes du mois"
          icon="receipt"
          value={formatNumber(stats.salesCount)}
          hint={stats.salesCount > 0 ? `Panier moyen : ${formatMoney(stats.averageBasket, currency)}` : "Aucune vente ce mois-ci"}
        />
        <StatCard
          label="Produits actifs"
          icon="box"
          value={formatNumber(stats.activeProductsCount)}
          hint={<Link href="/produits" className="font-medium text-brand-600 hover:underline">Voir le catalogue</Link>}
        />
        <StatCard
          label="Alertes de stock"
          icon="alert"
          value={formatNumber(stats.lowStockCount)}
          tone={stats.outOfStockCount > 0 ? "danger" : stats.lowStockCount > 0 ? "warning" : "success"}
          hint={stats.outOfStockCount > 0 ? `dont ${stats.outOfStockCount} en rupture` : "Aucune rupture"}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Chiffre d'affaires — 7 derniers jours"
            description={`${formatMoney(
              stats.trend.reduce((total, point) => total + point.value, 0),
              currency,
            )} sur la période · ventes annulées exclues`}
          />
          <div className="px-2 pb-4 pt-2">
            <RevenueTrendChart data={stats.trend} currency={currency} />
          </div>
        </Card>

        <Card>
          <CardHeader
            title="Stock faible"
            description={
              stats.lowStockCount > 0 ? `${stats.lowStockCount} produit(s) à réapprovisionner` : undefined
            }
            action={
              stats.lowStockCount > stats.lowStock.length ? (
                <Link href="/stock?lowStock=true" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                  Tout voir
                  <Icon name="arrowRight" className="h-3.5 w-3.5" />
                </Link>
              ) : undefined
            }
          />
          {stats.lowStock.length === 0 ? (
            <EmptyState compact icon="checkCircle" title="Aucune alerte" description="Tous vos produits ont un stock suffisant." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.lowStock.map((item) => (
                <li key={`${item.productId}-${item.storeId}`} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-900">{item.productName}</p>
                    <p className="text-xs text-slate-500">Seuil d&apos;alerte : {item.alertThreshold}</p>
                  </div>
                  <Badge dot tone={item.quantity <= 0 ? "danger" : "warning"}>
                    {item.quantity <= 0 ? "Rupture" : `${item.quantity} ${item.unit}`}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Meilleures ventes du mois" description="Classées par quantité vendue" />
          {stats.topProducts.length === 0 ? (
            <EmptyState compact icon="receipt" title="Aucune vente ce mois-ci" />
          ) : (
            <ol className="divide-y divide-slate-100">
              {stats.topProducts.map((product, index) => (
                <li key={product.productId} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-slate-50 text-xs font-semibold text-slate-500 ring-1 ring-inset ring-slate-200/70">
                      {index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{product.productName}</p>
                      <p className="text-xs text-slate-500">
                        {formatNumber(product.quantity)} {product.unit} vendu(s)
                      </p>
                    </div>
                  </div>
                  <span className="tabular shrink-0 text-sm font-medium text-slate-700" title="Montant des lignes, avant remise globale">
                    {formatMoney(product.amount, currency)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader
            title="Activité récente"
            action={
              <Link href="/ventes" className="inline-flex items-center gap-1 text-[13px] font-medium text-brand-600 hover:text-brand-700">
                Voir les ventes
                <Icon name="arrowRight" className="h-3.5 w-3.5" />
              </Link>
            }
          />
          {stats.recentActivity.length === 0 ? (
            <EmptyState compact icon="history" title="Aucune activité récente" description="Vos ventes et dépenses apparaîtront ici." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {stats.recentActivity.map((activity) => (
                <li key={`${activity.type}-${activity.id}`} className="flex items-center gap-3 px-5 py-3">
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${
                      activity.type === "expense"
                        ? "bg-red-50 text-red-500 ring-red-200/60"
                        : "bg-emerald-50 text-emerald-600 ring-emerald-200/60"
                    }`}
                  >
                    <Icon name={activity.type === "expense" ? "wallet" : "receipt"} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-medium text-slate-900">
                      <span className="min-w-0 truncate">{activity.label}</span>
                      {activity.type === "expense" && <Badge>Dépense</Badge>}
                      {activity.cancelled && <Badge dot tone="danger">Annulée</Badge>}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatDateTime(activity.createdAt)} · {activity.subtitle}
                    </p>
                  </div>
                  <span
                    className={`tabular shrink-0 text-sm font-semibold ${
                      activity.cancelled
                        ? "text-slate-400 line-through"
                        : activity.amount < 0
                          ? "text-red-600"
                          : "text-emerald-600"
                    }`}
                  >
                    {activity.amount < 0 ? "-" : "+"}
                    {formatMoney(Math.abs(activity.amount), currency)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
