import type { ComponentProps } from "react";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { loadPage } from "@/lib/api";
import { useSearchParamsRecord } from "@/lib/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/ui/Pagination";
import { ExpensesTable } from "./ExpensesTable";
import { NewExpenseButton } from "./NewExpenseButton";

type ExpensesPageData = {
  expenses: ComponentProps<typeof ExpensesTable>["expenses"];
  currency: string;
  page: number;
  totalPages: number;
  total: number;
};

export function loader({ request }: LoaderFunctionArgs) {
  return loadPage<ExpensesPageData>("/depenses", request);
}

export default function ExpensesPage() {
  const params = useSearchParamsRecord();
  const { expenses, currency, page, totalPages, total } = useLoaderData<ExpensesPageData>();

  return (
    <div>
      <PageHeader title="Dépenses" description="Suivez les charges de votre activité." action={<NewExpenseButton />} />

      <Card>
        <ExpensesTable expenses={expenses} currency={currency} />

        <Pagination basePath="/depenses" searchParams={params} page={page} totalPages={totalPages} total={total} />
      </Card>
    </div>
  );
}
