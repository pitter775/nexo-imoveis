import type { ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Home,
  KeyRound,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { BrandLogo } from '@/components/brand-logo';
import { getCurrentAuthenticatedUser } from '@/lib/auth';
import {
  getClientAccessSummary,
  type PurchasedProperty,
  type ClientSubscription,
} from '@/lib/client/purchased-properties';

export default async function DashboardPage() {
  const user = await getCurrentAuthenticatedUser();
  const access = user
    ? await getClientAccessSummary(user.id)
    : { properties: [], subscription: null };
  const properties = access.properties;
  const subscription = access.subscription;
  const hasMonthlyAccess = Boolean(subscription);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
            <BrandLogo href="/" compact className="shrink-0" />
            <span className="rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
              Área do cliente
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-primary/30 hover:text-primary sm:inline-flex"
            >
              <ArrowLeft className="size-4" />
              Voltar ao site
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-full bg-slate-950 px-4 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="p-6 sm:p-8">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-primary/80">
                Minha conta
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                Meus acessos premium
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                Acesse novamente as informações completas dos imóveis liberados
                para sua conta, seja por assinatura mensal ou compra avulsa.
              </p>
            </div>

            <div className="border-t border-slate-200 bg-slate-950 p-6 text-white sm:p-8 lg:border-l lg:border-t-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-blue-200">
                Status premium
              </p>
              <p className="mt-3 text-4xl font-extrabold">
                {hasMonthlyAccess ? 'Ativo' : formatNumber(properties.length)}
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {hasMonthlyAccess
                  ? 'assinatura mensal com acesso total'
                  : properties.length === 1
                    ? 'imóvel comprado'
                    : 'imóveis comprados'}
              </p>
            </div>
          </div>
        </section>

        {subscription ? <SubscriptionCard subscription={subscription} /> : null}

        <section className="mt-8">
          {hasMonthlyAccess ? (
            <div className="rounded-[2rem] border border-primary/20 bg-white p-8 shadow-sm">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.24em] text-primary">
                    Acesso total
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-950">
                    Todos os imóveis estão liberados
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
                    Enquanto sua assinatura estiver ativa, você pode abrir qualquer
                    oportunidade e consultar dossiê, documentos e assistente de IA.
                  </p>
                </div>
                <Link
                  href="/imoveis"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
                >
                  Ver todos os imóveis
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          ) : properties.length > 0 ? (
            <>
              <div className="mb-5">
                <h2 className="text-2xl font-extrabold text-slate-950">
                  Imóveis comprados avulsos
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                  Estes imóveis foram liberados individualmente para sua conta.
                </p>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PurchasedPropertyCard key={property.accessId} property={property} />
                ))}
              </div>
            </>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-8 text-center">
              <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Home className="size-6" />
              </div>
              <h2 className="mt-5 text-2xl font-extrabold text-slate-950">
                Nenhum imóvel liberado ainda
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-slate-500">
                Quando uma solicitação for paga e confirmada, ela aparecerá aqui.
              </p>
              <Link
                href="/imoveis"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
              >
                Ver oportunidades
                <ArrowRight className="size-4" />
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SubscriptionCard({ subscription }: { subscription: ClientSubscription }) {
  return (
    <section className="mt-8 overflow-hidden rounded-[2rem] border border-emerald-200 bg-emerald-50 shadow-sm">
      <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
              <ShieldCheck className="size-6" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700">
                Plano mensal
              </p>
              <h2 className="mt-1 text-2xl font-extrabold text-emerald-950">
                Assinatura ativa
              </h2>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-sm leading-7 text-emerald-900/80">
            Sua assinatura libera acesso completo a todos os imóveis da plataforma
            enquanto o pagamento recorrente estiver ativo.
          </p>
        </div>

        <div className="border-t border-emerald-200 bg-white/70 p-6 sm:p-8 lg:border-l lg:border-t-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <InfoPill
              icon={<CreditCard className="size-4" />}
              label="Mensalidade"
              value={`${formatCurrency(subscription.valor)}/mês`}
            />
            <InfoPill
              icon={<CalendarDays className="size-4" />}
              label="Início"
              value={formatDate(subscription.startedAt)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PurchasedPropertyCard({ property }: { property: PurchasedProperty }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="relative h-52 bg-slate-200">
        <Image
          src={property.imageUrl}
          alt={property.title}
          fill
          sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-3 py-1 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/20">
          <CheckCircle2 className="size-3.5" />
          Liberado
        </div>
      </div>

      <div className="space-y-5 p-5">
        <div>
          <p className="text-sm font-extrabold text-primary">{formatCurrency(property.price)}</p>
          <h2 className="mt-2 line-clamp-2 text-xl font-extrabold tracking-tight text-slate-950">
            {property.title}
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-500">
            <MapPin className="size-4 shrink-0 text-slate-400" />
            <span className="truncate">{property.location}</span>
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoPill
            icon={<CalendarDays className="size-4" />}
            label="Leilão"
            value={formatDate(property.auctionDate)}
          />
          <InfoPill
            icon={<KeyRound className="size-4" />}
            label="Compra"
            value={formatDate(property.purchasedAt)}
          />
        </div>

        <Link
          href={`/imoveis/${property.imovelId}`}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-extrabold text-white transition hover:bg-primary"
        >
          Abrir informações
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

function InfoPill({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="flex items-center gap-2 text-slate-400">{icon}</div>
      <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  }).format(date);
}
