import { createBrowserRouter, type ShouldRevalidateFunctionArgs } from "react-router";
import { redirectIfSignedIn } from "@/lib/api";
import RootLayout, { RootError } from "@/app/root";
import NotFound from "@/app/not-found";
import HomePage from "@/app/page";
import AuthLayout from "@/app/(auth)/layout";
import LoginPage from "@/app/(auth)/login/page";
import RegisterPage from "@/app/(auth)/register/page";
import OnboardingPage, { loader as onboardingLoader } from "@/app/onboarding/page";
import SuspendedPage, { loader as suspendedLoader } from "@/app/suspendu/page";
import AppLayout, { loader as appShellLoader } from "@/app/(app)/layout";
import AppError from "@/app/(app)/error";
import DashboardPage, { loader as dashboardLoader } from "@/app/(app)/dashboard/page";
import ProductsPage, { loader as productsLoader } from "@/app/(app)/produits/page";
import StockPage, { loader as stockLoader } from "@/app/(app)/stock/page";
import StockMovementsPage, { loader as stockMovementsLoader } from "@/app/(app)/stock/mouvements/page";
import SalesPage, { loader as salesLoader } from "@/app/(app)/ventes/page";
import NewSalePage, { loader as newSaleLoader } from "@/app/(app)/ventes/nouvelle/page";
import PurchasesPage, { loader as purchasesLoader } from "@/app/(app)/achats/page";
import CustomersPage, { loader as customersLoader } from "@/app/(app)/clients/page";
import SuppliersPage, { loader as suppliersLoader } from "@/app/(app)/fournisseurs/page";
import ExpensesPage, { loader as expensesLoader } from "@/app/(app)/depenses/page";
import SettingsPage, { loader as settingsLoader } from "@/app/(app)/parametres/page";
import AdminLayout, { loader as adminShellLoader } from "@/app/admin/layout";
import AdminError from "@/app/admin/error";
import AdminDashboardPage, { loader as adminDashboardLoader } from "@/app/admin/page";
import AdminOrganizationsPage, { loader as adminOrganizationsLoader } from "@/app/admin/boutiques/page";
import AdminOrganizationPage, { loader as adminOrganizationLoader } from "@/app/admin/boutiques/[id]/page";
import AdminUsersPage, { loader as adminUsersLoader } from "@/app/admin/utilisateurs/page";
import AdminAnalyticsPage, { loader as adminAnalyticsLoader } from "@/app/admin/statistiques/page";
import AdminActivityPage, { loader as adminActivityLoader } from "@/app/admin/activite/page";
import AdminProfilePage, { loader as adminProfileLoader } from "@/app/admin/profil/page";

/**
 * Le cadre (application ou administration) n'est pas rechargé quand seule la
 * recherche de l'adresse change (pagination, filtres) : ses données n'en
 * dépendent pas. Il l'est après chaque action (`router.refresh()`).
 */
function shellShouldRevalidate({ currentUrl, nextUrl, defaultShouldRevalidate }: ShouldRevalidateFunctionArgs) {
  const onlySearchChanged = currentUrl.pathname === nextUrl.pathname && currentUrl.search !== nextUrl.search;
  return onlySearchChanged ? false : defaultShouldRevalidate;
}

/** Pages du site : mêmes adresses que l'application d'origine. */
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RootError />,
    hydrateFallbackElement: <div className="min-h-screen bg-canvas" />,
    children: [
      // Pages publiques : un visiteur déjà connecté est envoyé vers son espace.
      { path: "/", loader: ({ request }) => redirectIfSignedIn(request), element: <HomePage /> },
      {
        element: <AuthLayout />,
        loader: ({ request }) => redirectIfSignedIn(request),
        children: [
          { path: "login", element: <LoginPage /> },
          { path: "register", element: <RegisterPage /> },
        ],
      },
      { path: "onboarding", loader: onboardingLoader, element: <OnboardingPage /> },
      { path: "suspendu", loader: suspendedLoader, element: <SuspendedPage /> },

      // Espace boutique.
      {
        element: <AppLayout />,
        loader: appShellLoader,
        shouldRevalidate: shellShouldRevalidate,
        children: [
          {
            errorElement: <AppError />,
            children: [
              { path: "dashboard", loader: dashboardLoader, element: <DashboardPage /> },
              { path: "produits", loader: productsLoader, element: <ProductsPage /> },
              { path: "stock", loader: stockLoader, element: <StockPage /> },
              { path: "stock/mouvements", loader: stockMovementsLoader, element: <StockMovementsPage /> },
              { path: "ventes", loader: salesLoader, element: <SalesPage /> },
              { path: "ventes/nouvelle", loader: newSaleLoader, element: <NewSalePage /> },
              { path: "achats", loader: purchasesLoader, element: <PurchasesPage /> },
              { path: "clients", loader: customersLoader, element: <CustomersPage /> },
              { path: "fournisseurs", loader: suppliersLoader, element: <SuppliersPage /> },
              { path: "depenses", loader: expensesLoader, element: <ExpensesPage /> },
              { path: "parametres", loader: settingsLoader, element: <SettingsPage /> },
            ],
          },
        ],
      },

      // Espace super administrateur.
      {
        path: "admin",
        element: <AdminLayout />,
        loader: adminShellLoader,
        shouldRevalidate: shellShouldRevalidate,
        children: [
          {
            errorElement: <AdminError />,
            children: [
              { index: true, loader: adminDashboardLoader, element: <AdminDashboardPage /> },
              { path: "boutiques", loader: adminOrganizationsLoader, element: <AdminOrganizationsPage /> },
              { path: "boutiques/:id", loader: adminOrganizationLoader, element: <AdminOrganizationPage /> },
              { path: "utilisateurs", loader: adminUsersLoader, element: <AdminUsersPage /> },
              { path: "statistiques", loader: adminAnalyticsLoader, element: <AdminAnalyticsPage /> },
              { path: "activite", loader: adminActivityLoader, element: <AdminActivityPage /> },
              { path: "profil", loader: adminProfileLoader, element: <AdminProfilePage /> },
            ],
          },
        ],
      },

      { path: "*", element: <NotFound /> },
    ],
  },
]);
