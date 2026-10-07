import { Link } from "@/lib/navigation";
import { useDocumentTitle } from "@/lib/document";
import { Icon } from "@/components/ui/Icon";
import { LandingNav } from "@/components/landing/LandingNav";
import { PreviewTabs } from "@/components/landing/PreviewTabs";
import { DashboardMockup, SaleMockup, SalesMockup, StockMockup } from "@/components/landing/mockups";
import { CtaLink, LANDING_LINKS, LOGIN_HREF, Logo, REGISTER_HREF, SectionHeading } from "@/components/landing/parts";

// Page d'accueil publique. Entièrement statique : les visiteurs déjà
// connectés sont redirigés vers leur espace avant d'arriver ici (voir
// `router.tsx`).

const PAGE_TITLE = "Rayon — Gestion de magasin pour commerçants";
const PAGE_DESCRIPTION =
  "Rayon est une application web de gestion de magasin : produits, stock, ventes, achats, dépenses et tableau de bord pour suivre le chiffre d'affaires et le bénéfice de votre boutique.";

const DAILY_USES = [
  {
    icon: "cart",
    title: "Vendre",
    text: "Composez le panier, choisissez le mode de paiement et encaissez. Le stock est décompté au même moment.",
  },
  {
    icon: "truck",
    title: "Approvisionner",
    text: "Enregistrez vos achats fournisseurs : les quantités reçues s'ajoutent aussitôt au stock de la boutique.",
  },
  {
    icon: "chart",
    title: "Piloter",
    text: "Consultez votre chiffre d'affaires, votre marge, vos dépenses et votre bénéfice net du mois.",
  },
];

const FEATURES = [
  {
    icon: "grid",
    title: "Tableau de bord",
    text: "Chiffre d'affaires du mois et du jour, marge brute, dépenses, bénéfice net, panier moyen, courbe des 7 derniers jours et meilleures ventes.",
  },
  {
    icon: "box",
    title: "Produits",
    text: "Un catalogue avec catégories, prix d'achat et de vente, unité et seuil d'alerte. Un produit peut être archivé sans être supprimé.",
  },
  {
    icon: "layers",
    title: "Stock",
    text: "La quantité disponible par boutique, un statut OK, stock faible ou rupture, des ajustements manuels et l'historique de chaque mouvement.",
  },
  {
    icon: "receipt",
    title: "Ventes",
    text: "Un écran de vente avec panier, client optionnel, remise et mode de paiement : espèces, carte, Mobile Money ou crédit client. Une vente peut être annulée.",
  },
  {
    icon: "truck",
    title: "Achats",
    text: "Saisissez vos approvisionnements par fournisseur, avec les quantités et le coût unitaire de chaque produit reçu.",
  },
  {
    icon: "users",
    title: "Clients et fournisseurs",
    text: "Un carnet de clients avec le nombre de ventes de chacun, et la liste de vos fournisseurs avec leurs coordonnées.",
  },
  {
    icon: "wallet",
    title: "Dépenses",
    text: "Notez vos charges par catégorie — loyer, salaires, électricité, transport… — pour qu'elles soient déduites de votre bénéfice.",
  },
  {
    icon: "store",
    title: "Boutiques et équipe",
    text: "Gérez plusieurs boutiques depuis le même compte et ajoutez vos collaborateurs, chacun avec son rôle.",
  },
];

const STEPS = [
  {
    title: "Créez votre compte",
    text: "Prénom, nom, mot de passe et un email ou un numéro de téléphone : c'est tout ce qu'il faut pour ouvrir votre espace.",
  },
  {
    title: "Configurez votre boutique",
    text: "Donnez un nom à votre organisation et à votre boutique, puis choisissez votre devise. L'adresse et le téléphone sont optionnels.",
  },
  {
    title: "Ajoutez vos produits",
    text: "Pour chaque produit : prix d'achat, prix de vente, stock initial et seuil d'alerte. Le premier peut être créé dès la configuration.",
  },
  {
    title: "Enregistrez vos ventes",
    text: "Cliquez sur les produits pour remplir le panier, indiquez le client et le paiement, puis encaissez. Le stock se met à jour tout seul.",
  },
  {
    title: "Suivez votre activité",
    text: "Le tableau de bord calcule vos résultats du mois et vous signale les produits à réapprovisionner.",
  },
];

const BENEFITS = [
  {
    icon: "history",
    title: "Un stock qui se met à jour tout seul",
    text: "Chaque vente, achat, annulation ou ajustement modifie le stock et laisse une ligne dans l'historique des mouvements, avec la date et l'auteur.",
  },
  {
    icon: "coins",
    title: "Votre bénéfice, pas seulement vos recettes",
    text: "Le coût d'achat est mémorisé à chaque vente. Vous voyez votre marge brute, puis votre bénéfice net une fois les dépenses déduites.",
  },
  {
    icon: "alert",
    title: "Prévenu avant la rupture",
    text: "Chaque produit a son seuil d'alerte. Dès que le stock passe dessous, il apparaît dans la liste « Stock faible » du tableau de bord.",
  },
  {
    icon: "shield",
    title: "À chacun son rôle",
    text: "Propriétaire, administrateur, gérant, vendeur ou gestionnaire de stock : chaque membre n'accède qu'aux actions de son rôle, et peut être limité à une seule boutique.",
  },
  {
    icon: "building",
    title: "Plusieurs boutiques, un seul compte",
    text: "Chaque boutique garde son propre stock et ses propres ventes. Vous passez de l'une à l'autre depuis le haut de l'écran.",
  },
  {
    icon: "bank",
    title: "Dans votre devise",
    text: "Les montants s'affichent dans la devise choisie pour votre organisation : franc CFA (XOF, XAF), euro, dollar US, dirham, franc guinéen ou franc congolais.",
  },
];

const SECTION = "scroll-mt-20 px-4 py-20 sm:px-6 sm:py-24 lg:px-8";

export default function HomePage() {
  useDocumentTitle(PAGE_TITLE, PAGE_DESCRIPTION);

  return (
    <div className="landing min-h-full bg-white">
      <LandingNav />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8">
          {/* Même trame légère que les écrans de connexion. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-size-[48px_48px] opacity-50 mask-[radial-gradient(ellipse_at_top,black_15%,transparent_65%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 h-80 w-208 max-w-full -translate-x-1/2 rounded-full bg-brand-200/40 blur-3xl"
          />

          <div className="relative mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl animate-slide-up text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-[13px] font-medium text-slate-600 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
                Application web de gestion de magasin
              </p>
              <h1 className="mt-6 text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Vos produits, votre stock et vos ventes, <span className="text-brand-600">au même endroit</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
                Rayon aide les commerçants à tenir leur boutique au quotidien : enregistrer chaque vente, suivre le stock
                produit par produit et savoir ce que le magasin a réellement gagné ce mois-ci.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <CtaLink href={REGISTER_HREF} size="lg">
                  Créer un compte
                  <Icon name="arrowRight" className="h-4 w-4" />
                </CtaLink>
                <CtaLink href={LOGIN_HREF} size="lg" variant="secondary">
                  Se connecter
                </CtaLink>
              </div>
            </div>

            <div className="mt-14 animate-slide-up sm:mt-16">
              <DashboardMockup />
              <p className="mt-4 text-center text-xs text-slate-400">
                Aperçu du tableau de bord, affiché ici avec des données d&apos;exemple.
              </p>
            </div>
          </div>
        </section>

        {/* Présentation */}
        <section id="presentation" className={`${SECTION} border-t border-slate-200/70 bg-canvas`}>
          <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            <div>
              <SectionHeading align="left" eyebrow="Présentation" title="Qu'est-ce que Rayon ?" />
              <div className="reveal mt-6 space-y-4 text-base leading-7 text-slate-600">
                <p>
                  Rayon est une application de gestion de magasin qui s&apos;utilise dans un navigateur, sur ordinateur,
                  tablette ou téléphone. Elle s&apos;adresse aux commerçants et à leurs équipes : propriétaire, gérant,
                  vendeurs et gestionnaires de stock.
                </p>
                <p>
                  Elle remplace le cahier et les tableaux dispersés par un seul espace : votre catalogue de produits, les
                  quantités en stock, les ventes de la journée, les achats auprès de vos fournisseurs et les dépenses de
                  la boutique.
                </p>
                <p>
                  À partir de ces informations, Rayon calcule pour vous le chiffre d&apos;affaires, la marge et le bénéfice
                  net, et vous montre les produits qui vont manquer.
                </p>
              </div>
            </div>

            <ul className="space-y-4 lg:pt-2">
              {DAILY_USES.map((use) => (
                <li key={use.title} className="reveal flex gap-4 rounded-xl border border-slate-200/80 bg-white p-5 shadow-card">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-200/70">
                    <Icon name={use.icon} className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-[15px] font-semibold text-slate-900">{use.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{use.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Fonctionnalités */}
        <section id="fonctionnalites" className={SECTION}>
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Fonctionnalités"
              title="Tout ce qu'il faut pour gérer une boutique"
              description="Les modules que vous retrouvez dans le menu de l'application."
            />
            <ul className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <li
                  key={feature.title}
                  className="reveal group rounded-xl border border-slate-200/80 bg-white p-5 shadow-card transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-[0_12px_30px_-16px_rgb(15_23_42/0.22)]"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200/70 transition-colors duration-200 group-hover:bg-brand-50 group-hover:text-brand-600 group-hover:ring-brand-200/70">
                    <Icon name={feature.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-slate-900">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{feature.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Comment ça marche */}
        <section id="fonctionnement" className={`${SECTION} border-y border-slate-200/70 bg-canvas`}>
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Comment ça marche"
              title="De l'inscription à la première vente"
              description="Cinq étapes, dans l'ordre où vous les rencontrerez dans l'application."
            />
            <ol className="mx-auto mt-12 max-w-3xl">
              {STEPS.map((step, index) => (
                <li key={step.title} className="reveal relative flex gap-5 pb-8 last:pb-0">
                  {index < STEPS.length - 1 && <span aria-hidden className="absolute bottom-0 left-5 top-12 w-px bg-slate-200" />}
                  <span className="tabular flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-brand-700 shadow-xs ring-1 ring-inset ring-brand-200">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="pt-1.5">
                    <h3 className="text-base font-semibold text-slate-900">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 sm:text-[15px]">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="reveal mt-10 flex justify-center">
              <CtaLink href={REGISTER_HREF} size="lg">
                Commencer par l&apos;étape 1
                <Icon name="arrowRight" className="h-4 w-4" />
              </CtaLink>
            </div>
          </div>
        </section>

        {/* Aperçu */}
        <section id="apercu" className={SECTION}>
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Aperçu"
              title="Les écrans que vous utiliserez tous les jours"
              description="Ces aperçus reprennent les écrans de l'application, remplis avec des données d'exemple."
            />
            <div className="reveal mt-10 rounded-3xl bg-canvas p-3 ring-1 ring-inset ring-slate-200/70 sm:p-6">
              <PreviewTabs
                tabs={[
                  {
                    id: "vente",
                    label: "Nouvelle vente",
                    icon: "cart",
                    caption: "Les produits à gauche, le panier à droite : la vente est encaissée en quelques clics.",
                    content: <SaleMockup />,
                  },
                  {
                    id: "stock",
                    label: "Stock",
                    icon: "layers",
                    caption: "La quantité de chaque produit dans la boutique, avec son statut.",
                    content: <StockMockup />,
                  },
                  {
                    id: "ventes",
                    label: "Historique des ventes",
                    icon: "receipt",
                    caption: "Toutes les ventes de la boutique, y compris celles qui ont été annulées.",
                    content: <SalesMockup />,
                  },
                ]}
              />
            </div>
          </div>
        </section>

        {/* Avantages */}
        <section id="avantages" className={`${SECTION} border-t border-slate-200/70 bg-canvas`}>
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              eyebrow="Avantages"
              title="Pourquoi gérer votre magasin avec Rayon ?"
              description="Ce que l'application change concrètement dans la tenue d'une boutique."
            />
            <ul className="mt-12 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {BENEFITS.map((benefit) => (
                <li key={benefit.title} className="reveal">
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-brand-600 shadow-xs ring-1 ring-inset ring-slate-200">
                    <Icon name={benefit.icon} className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-slate-900">{benefit.title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{benefit.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Appel à l'action final */}
        <section className="px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
          <div className="reveal relative mx-auto max-w-6xl overflow-hidden rounded-3xl bg-slate-900 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] bg-size-[48px_48px] mask-[radial-gradient(ellipse_at_center,black_10%,transparent_70%)]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-64 w-106 max-w-full -translate-x-1/2 rounded-full bg-brand-500/30 blur-3xl"
            />
            <div className="relative mx-auto max-w-2xl">
              <h2 className="text-balance text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Prêt à mieux gérer votre magasin ?
              </h2>
              <p className="mt-4 text-pretty text-base leading-7 text-slate-300 sm:text-lg">
                Créez votre compte, configurez votre boutique et enregistrez votre première vente.
              </p>
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                <CtaLink href={REGISTER_HREF} size="lg" variant="light">
                  Créer un compte
                  <Icon name="arrowRight" className="h-4 w-4" />
                </CtaLink>
                <CtaLink href={LOGIN_HREF} size="lg" variant="outlineLight">
                  Se connecter
                </CtaLink>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200/80 bg-white px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <Logo />
            <p className="mt-4 max-w-sm text-sm leading-6 text-slate-600">
              Application web de gestion de magasin pour les commerçants : produits, stock, ventes, achats, dépenses et
              tableau de bord.
            </p>
          </div>

          <nav aria-label="Sections">
            <p className="text-sm font-semibold text-slate-900">La page</p>
            <ul className="mt-3 space-y-2">
              {LANDING_LINKS.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm text-slate-600 transition-colors hover:text-brand-700">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Compte">
            <p className="text-sm font-semibold text-slate-900">Votre compte</p>
            <ul className="mt-3 space-y-2">
              <li>
                <FooterLink href={LOGIN_HREF}>Se connecter</FooterLink>
              </li>
              <li>
                <FooterLink href={REGISTER_HREF}>Créer un compte</FooterLink>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mx-auto mt-10 max-w-6xl border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-400">Rayon · Gestion de magasin</p>
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="text-sm text-slate-600 transition-colors hover:text-brand-700">
      {children}
    </Link>
  );
}
