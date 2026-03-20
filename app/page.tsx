'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bath,
  Bed,
  Calendar,
  CheckCircle2,
  Filter,
  FileSearch,
  Heart,
  Home,
  Landmark,
  LoaderCircle,
  MapPin,
  Menu,
  MessageCircle,
  Scale,
  Search,
  Send,
  Share2,
  ShieldCheck,
  Square,
  Target,
  UserRound,
  UserCog,
  X,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { ChatMessage, Property, User as UserType } from '@/lib/types';
import { SiteFooter } from '@/components/site-footer';

type InfraChatWindow = Window & {
  InfraChat?: {
    setContext: (context: {
      title: string;
      theme: string;
      accent: string;
      transparent: boolean;
      id: string;
    }) => void;
  };
};

const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000';

const HOME_MENU_ITEMS: ReadonlyArray<{
  label: string;
  id: string;
}> = [
  { label: 'Home', id: 'topo' },
  { label: 'Sobre Nos', id: 'sobre' },
  { label: 'Servicos', id: 'servicos' },
  { label: 'Planos', id: 'planos' },
] as const;

type PublicMarketplaceProps = {
  initialView?: 'home' | 'listings' | 'details';
  initialPropertyId?: string;
};

export function PublicMarketplace({
  initialView = 'home',
  initialPropertyId,
}: PublicMarketplaceProps) {
  const router = useRouter();
  const [view, setView] = useState<'home' | 'listings' | 'details'>(initialView);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);
  const [activeSection, setActiveSection] = useState('topo');

  useEffect(() => {
    setView(initialView);
  }, [initialView]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        const [userResponse, propertiesResponse] = await Promise.all([
          fetch('/api/me', { cache: 'no-store' }),
          fetch('/api/imoveis', { cache: 'no-store' }),
        ]);

        const userData = await userResponse.json();
        const propertiesData = await propertiesResponse.json();

        if (!isMounted) {
          return;
        }

        setUser(userData.user ?? null);
        setProperties(propertiesData.properties ?? []);
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setUser(null);
          setProperties([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingUser(false);
          setIsLoadingProperties(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (initialView !== 'details') {
      setSelectedProperty(null);
      return;
    }

    if (!initialPropertyId || properties.length === 0) {
      return;
    }

    const property = properties.find((item) => item.id === initialPropertyId) ?? null;
    setSelectedProperty(property);
  }, [initialPropertyId, initialView, properties]);

  useEffect(() => {
    if (view !== 'home' || typeof window === 'undefined') {
      return;
    }

    const hash = window.location.hash.replace('#', '');

    if (!hash) {
      return;
    }

    const scrollToHash = () => {
      const section = document.getElementById(hash);

      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    const timeoutId = window.setTimeout(scrollToHash, 50);

    return () => window.clearTimeout(timeoutId);
  }, [view, properties.length, isLoadingProperties]);

  useEffect(() => {
    if (view !== 'home' || typeof window === 'undefined') {
      return;
    }

    const sections = HOME_MENU_ITEMS.map((item) => document.getElementById(item.id)).filter(
      (section): section is HTMLElement => Boolean(section),
    );

    if (sections.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

        if (visibleEntry?.target?.id) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        rootMargin: '-18% 0px -52% 0px',
        threshold: [0.2, 0.35, 0.55],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, [view]);

  const handleMenuNavigation = (sectionId: string) => {
    setIsMenuOpen(false);
    setView('home');
    setSelectedProperty(null);

    if (typeof window === 'undefined') {
      return;
    }

    const targetHref = sectionId === 'topo' ? '/' : `/#${sectionId}`;

    if (window.location.pathname !== '/') {
      router.push(targetHref);
      return;
    }

    if (sectionId === 'topo') {
      setActiveSection('topo');
      window.history.replaceState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveSection(sectionId);
    window.history.replaceState(null, '', targetHref);
    const section = document.getElementById(sectionId);

    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setView('details');
    router.push(`/imoveis/${property.id}`);
  };

  const handleBrowse = () => {
    setView('listings');
    setSelectedProperty(null);
    router.push('/imoveis');
  };

  const handleGoHome = () => {
    setView('home');
    setSelectedProperty(null);
    router.push('/');
  };

  const adminHref = user?.tipo_usuario === 'admin' ? '/admin' : null;
  const isDetailPending =
    view === 'details' && Boolean(initialPropertyId) && selectedProperty === null;
  const isContentReady = !isLoadingProperties && !isDetailPending;

  const handleBackToListings = () => {
    setView('listings');
    setSelectedProperty(null);
    router.push('/imoveis');
  };

  const featuredProperties = useMemo(() => {
    const highlighted = properties
      .filter((property) => property.destaque)
      .sort((first, second) => {
        const firstOrder = first.ordem_destaque ?? Number.MAX_SAFE_INTEGER;
        const secondOrder = second.ordem_destaque ?? Number.MAX_SAFE_INTEGER;
        return firstOrder - secondOrder;
      });

    if (highlighted.length >= 3) {
      return highlighted.slice(0, 3);
    }

    const fallback = properties.filter(
      (property) => !highlighted.some((highlightedProperty) => highlightedProperty.id === property.id),
    );

    return [...highlighted, ...fallback].slice(0, 3);
  }, [properties]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-slate-900 selection:bg-primary/30">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={handleGoHome}
          >
            <div className="rounded-lg bg-primary p-1.5">
              <Home className="size-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Nexo Leiloes
            </span>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {HOME_MENU_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuNavigation(item.id)}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  activeSection === item.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-slate-600 hover:text-primary'
                }`}
              >
                {item.label}
              </button>
            ))}
            <a
              href="https://wa.me/5511916751213"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
            >
              <MessageCircle className="size-4" />
              (11) 91675-1213
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden min-h-11 min-w-[260px] items-center justify-end md:flex">
              {isLoadingUser ? (
                <div className="flex w-full max-w-[260px] items-center justify-end gap-2">
                  <div className="h-11 w-[208px] animate-pulse rounded-full border border-slate-200 bg-slate-100" />
                  <div className="size-11 animate-pulse rounded-full border border-slate-200 bg-slate-100" />
                </div>
              ) : !user ? (
                <div className="flex w-full justify-end">
                  <Link
                    href="/login"
                    className="inline-flex h-11 min-w-[132px] items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
                  >
                    Login
                  </Link>
                </div>
              ) : (
                <div
                  className="relative"
                  onMouseEnter={() => setIsUserMenuOpen(true)}
                  onMouseLeave={() => setIsUserMenuOpen(false)}
                >
                  <div className="flex items-center gap-2">
                    {adminHref ? (
                      <Link
                        href={adminHref}
                        className="flex h-11 w-[208px] items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2 transition hover:border-primary/30 hover:bg-primary/5"
                      >
                        <span className="truncate text-sm font-medium">{user.email}</span>
                        <UserAvatar email={user.email} />
                      </Link>
                    ) : (
                      <div className="flex h-11 w-[208px] items-center gap-3 rounded-full border border-slate-200 bg-white px-3 py-2">
                        <span className="truncate text-sm font-medium">{user.email}</span>
                        <UserAvatar email={user.email} />
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label="Abrir menu do usuario"
                      onClick={() => setIsUserMenuOpen((current) => !current)}
                      className="inline-flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-primary/30 hover:text-primary"
                    >
                      <ChevronDown
                        className={`size-4 transition-transform ${
                          isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>

                  <AnimatePresence>
                    {isUserMenuOpen ? (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.98 }}
                        className="absolute right-0 top-[calc(100%+0.75rem)] z-50 min-w-[220px] rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/80"
                      >
                        {adminHref ? (
                          <Link
                            href={adminHref}
                            className="flex items-center gap-3 rounded-[1.1rem] px-3 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            <UserCog className="size-4 text-primary" />
                            Ambiente administrativo
                          </Link>
                        ) : null}
                        <form action={logoutAction} className="mt-1">
                          <button
                            type="submit"
                            className="flex w-full items-center gap-3 rounded-[1.1rem] px-3 py-3 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50 hover:text-slate-900"
                          >
                            <ArrowLeft className="size-4 text-primary" />
                            Sair
                          </button>
                        </form>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              )}
            </div>
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 z-40 border-b border-slate-200 bg-white p-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              {HOME_MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuNavigation(item.id)}
                  className={`rounded-2xl px-4 py-3 text-left font-semibold transition ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <a
                href="https://wa.me/5511916751213"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-3 font-semibold text-white shadow-lg shadow-primary/20"
              >
                <MessageCircle className="size-4" />
                (11) 91675-1213
              </a>
              <button
                onClick={() => {
                  setView('listings');
                  router.push('/imoveis');
                  setIsMenuOpen(false);
                }}
                className="rounded-2xl bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-100"
              >
                Oportunidades
              </button>
              {isLoadingUser ? (
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              ) : user ? (
                <>
                  {adminHref ? (
                    <Link
                      href={adminHref}
                      onClick={() => setIsMenuOpen(false)}
                      className="rounded-2xl bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Ambiente administrativo
                    </Link>
                  ) : null}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Sair
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-2xl bg-slate-950 px-4 py-3 text-left font-semibold text-white"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait" initial={false}>
          {!isContentReady ? (
            <motion.div
              key={`loading-${view}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              <MarketplaceLoadingState view={view} />
            </motion.div>
          ) : (
            <motion.div
              key={`${view}-${selectedProperty?.id ?? 'root'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
            >
              {view === 'home' && (
                <HomeView
                  featuredProperties={featuredProperties}
                  isAdmin={user?.tipo_usuario === 'admin'}
                  isLoading={isLoadingProperties}
                  onBrowse={handleBrowse}
                  onNavigate={handleMenuNavigation}
                  onPropertyClick={handlePropertyClick}
                  properties={properties}
                />
              )}
              {view === 'listings' && (
                <ListingsView
                  isAdmin={user?.tipo_usuario === 'admin'}
                  isLoading={isLoadingProperties}
                  properties={properties}
                  onPropertyClick={handlePropertyClick}
                />
              )}
              {view === 'details' && selectedProperty && (
                <PropertyDetailsView
                  property={selectedProperty}
                  user={user}
                  onBack={handleBackToListings}
                />
              )}
              {view === 'details' && !selectedProperty && !isLoadingProperties ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
                  Imovel nao encontrado.
                </div>
              ) : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
      <motion.div
        initial={false}
        animate={{
          opacity: isContentReady ? 1 : 0,
          y: isContentReady ? 0 : 16,
        }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        aria-hidden={!isContentReady}
      >
        <SiteFooter onNavigate={handleMenuNavigation} />
      </motion.div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-4 py-2 md:hidden">
        <button
          onClick={handleGoHome}
          className={`flex flex-col items-center gap-1 ${
            view === 'home' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Home className="size-5" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button
          onClick={handleBrowse}
          className={`flex flex-col items-center gap-1 ${
            view === 'listings' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Search className="size-5" />
          <span className="text-[10px] font-bold">Buscar</span>
        </button>
      </div>
    </div>
  );
}

export default function App() {
  return <PublicMarketplace />;
}

function MarketplaceLoadingState({
  view,
}: {
  view: 'home' | 'listings' | 'details';
}) {
  if (view === 'listings') {
    return (
      <div className="space-y-8 pb-12">
        <div className="h-16 w-56 rounded-full bg-slate-200/80" />
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={`listing-skeleton-${index}`}
              className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] bg-slate-200/80" />
              <div className="space-y-4 p-5">
                <div className="h-6 w-2/5 rounded-full bg-slate-200/80" />
                <div className="h-5 w-4/5 rounded-full bg-slate-200/70" />
                <div className="h-4 w-full rounded-full bg-slate-100" />
                <div className="h-4 w-3/4 rounded-full bg-slate-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (view === 'details') {
    return (
      <div className="space-y-8 pb-12">
        <div className="h-12 w-44 rounded-full bg-slate-200/80" />
        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="aspect-[16/10] rounded-[2rem] bg-slate-200/80" />
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
              <div className="h-6 w-2/3 rounded-full bg-slate-200/80" />
              <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
              <div className="mt-3 h-4 w-5/6 rounded-full bg-slate-100" />
              <div className="mt-3 h-4 w-4/6 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
            <div className="h-7 w-1/2 rounded-full bg-slate-200/80" />
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`detail-metric-${index}`}
                  className="rounded-[1.5rem] bg-slate-100 p-5"
                >
                  <div className="h-3 w-16 rounded-full bg-slate-200/80" />
                  <div className="mt-3 h-5 w-24 rounded-full bg-slate-200/60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-12">
      <section className="grid gap-10 py-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-5">
          <div className="h-8 w-56 rounded-full bg-primary/15" />
          <div className="h-14 w-full max-w-3xl rounded-[1.5rem] bg-slate-200/80" />
          <div className="h-14 w-4/5 max-w-2xl rounded-[1.5rem] bg-slate-200/70" />
          <div className="h-5 w-full max-w-xl rounded-full bg-slate-100" />
          <div className="h-5 w-5/6 max-w-lg rounded-full bg-slate-100" />
        </div>
        <div className="aspect-[4/3] rounded-[2.25rem] bg-slate-200/80 shadow-xl shadow-slate-900/5" />
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`home-card-${index}`}
            className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm"
          >
            <div className="h-12 w-12 rounded-2xl bg-primary/10" />
            <div className="mt-5 h-6 w-4/5 rounded-full bg-slate-200/80" />
            <div className="mt-4 h-4 w-full rounded-full bg-slate-100" />
            <div className="mt-3 h-4 w-5/6 rounded-full bg-slate-100" />
          </div>
        ))}
      </section>
    </div>
  );
}

function HomeView({
  featuredProperties,
  isAdmin = false,
  isLoading,
  onBrowse,
  onNavigate,
  onPropertyClick,
  properties,
}: {
  featuredProperties: Property[];
  isAdmin?: boolean;
  isLoading: boolean;
  onBrowse: () => void;
  onNavigate: (sectionId: string) => void;
  onPropertyClick: (p: Property) => void;
  properties: Property[];
}) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const visibleProperties = properties.slice(0, visibleCount);
  const hasMoreProperties = visibleCount < properties.length;
  const featuredProperty = featuredProperties[featuredIndex] ?? null;

  useEffect(() => {
    setFeaturedIndex(0);
  }, [featuredProperties]);

  useEffect(() => {
    if (featuredProperties.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setFeaturedIndex((currentIndex) => (currentIndex + 1) % featuredProperties.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [featuredProperties]);

  return (
    <div className="space-y-12 pb-12">
      <InfraChatHomeWidget />
      <section
        id="topo"
        className="flex scroll-mt-24 flex-col items-center gap-12 py-6 lg:flex-row"
      >
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            Assessoria especializada em leiloes imobiliarios
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Compre imoveis de leilao com{' '}
            <span className="text-primary">seguranca e estrategia comprovada</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Da analise do edital a posse cuidamos de todo o processo para voce
            investir com seguranca e aumentar suas chances de lucro.
          </p>

        </div>

        <div className="w-full flex-1">
          <div className="relative h-[300px] w-full overflow-hidden rounded-2xl shadow-2xl sm:h-[450px]">
            <Image
              src={featuredProperty?.image_url ?? HERO_FALLBACK_IMAGE}
              fill
              className="object-cover"
              alt={featuredProperty?.title ?? 'Hero'}
              priority
              referrerPolicy="no-referrer"
              unoptimized
            />
            <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-md">
              {featuredProperty ? (
                <>
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs font-bold uppercase text-primary">
                        Em destaque
                      </p>
                      <p className="truncate text-sm font-bold text-slate-900">
                        {featuredProperty.title}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {featuredProperty.location || 'Localizacao nao informada'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Lance minimo</p>
                      <p className="text-sm font-bold text-slate-900">
                        {formatCurrency(featuredProperty.price)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {featuredProperties.map((property, index) => (
                        <button
                          key={property.id}
                          type="button"
                          aria-label={`Exibir destaque ${index + 1}`}
                          onClick={() => setFeaturedIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            index === featuredIndex
                              ? 'w-8 bg-primary'
                              : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                          }`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => onPropertyClick(featuredProperty)}
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                      Ver imovel
                    </button>
                    {isAdmin ? (
                      <AdminEditPropertyLink propertyId={featuredProperty.id} compact />
                    ) : null}
                  </div>
                </>
              ) : (
                <div>
                  <p className="text-xs font-bold uppercase text-primary">
                    Nenhum imovel encontrado
                  </p>
                  <p className="text-sm text-slate-600">
                    Cadastre imoveis no admin para alimentar esta vitrine.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-24">
        <div className="mb-8 space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            Diferenciais
          </p>
          <h2 className="w-full text-[1.8rem] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-[2rem] lg:whitespace-nowrap lg:text-[2.45rem]">
            Inteligencia, seguranca e acompanhamento em todas as etapas
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <BriefcaseBusiness className="size-6 text-primary" />,
              title: 'Assessoria completa do lance a chave na mao',
              text: 'Acompanhamos todo o processo, desde a analise do edital ate a entrega do imovel.',
            },
            {
              icon: <ShieldCheck className="size-6 text-primary" />,
              title: 'Seguranca total em cada etapa do leilao',
              text: 'Nossa equipe analisa os riscos juridicos e financeiros antes de qualquer recomendacao.',
            },
            {
              icon: <Scale className="size-6 text-primary" />,
              title: 'Analise juridica completa',
              text: 'Verificamos processos, matricula, dividas e possiveis riscos antes do arremate.',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="mb-5 inline-flex rounded-2xl bg-primary/10 p-3">
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="sobre"
        className="scroll-mt-24 rounded-[2.25rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10"
      >
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-5">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
              Sobre a Nexo
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Sobre a Nexo
            </h2>
            <p className="text-base leading-8 text-slate-600">
              A Nexo Leiloes conecta investidores e compradores as melhores
              oportunidades do mercado de leiloes imobiliarios.
            </p>
            <p className="text-base leading-8 text-slate-600">
              Nossa equipe realiza analises detalhadas dos imoveis disponiveis,
              avaliando riscos, potencial de valorizacao e estrategias de aquisicao.
            </p>
            <p className="text-base leading-8 text-slate-600">
              Nosso objetivo e tornar o processo de compra em leiloes mais simples,
              seguro e acessivel, seja para quem deseja conquistar a casa propria ou
              investir com inteligencia.
            </p>
            <button
              type="button"
              onClick={() => window.open('https://wa.me/5511916751213', '_blank', 'noopener,noreferrer')}
              className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Saiba mais
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              'Avaliacao tecnica e juridica antes de cada indicacao.',
              'Oportunidades selecionadas com foco em seguranca e margem.',
              'Atendimento consultivo para investidor e comprador final.',
              'Acompanhamento estrategico do edital a posse.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5"
              >
                <CheckCircle2 className="mb-3 size-5 text-primary" />
                <p className="text-sm leading-7 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="scroll-mt-24" id="planos">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            Oportunidades de imoveis
          </p>
          <h3 className="text-3xl font-bold text-slate-900">
            Oportunidades exclusivas de imoveis em leilao
          </h3>
          <p className="text-base leading-8 text-slate-600">
            Explore imoveis selecionados com analise previa da equipe Nexo.
            Encontre oportunidades com valores abaixo do mercado e potencial real de valorizacao.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900">
            Imoveis selecionados
          </h3>
          <button
            onClick={onBrowse}
            className="text-sm font-bold text-primary hover:underline"
          >
            Ver todos
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Carregando imoveis...
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Nenhum imovel disponivel no momento.
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {visibleProperties.map((property) => (
                <PropertyCard
                  key={property.id}
                  isAdmin={isAdmin}
                  property={property}
                  onClick={() => onPropertyClick(property)}
                />
              ))}
            </div>

            {hasMoreProperties ? (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + 6)}
                  className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
                >
                  Carregar mais 6 imoveis
                </button>
              </div>
            ) : null}
          </div>
        )}
      </section>

      <section className="scroll-mt-24" id="servicos">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            Como funciona
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Como funciona nossa assessoria
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: <Target className="size-5 text-primary" />,
              title: 'Analise e Estrategia',
              text: 'Entendemos seu objetivo: investir, revender ou adquirir um imovel para moradia.',
            },
            {
              icon: <FileSearch className="size-5 text-primary" />,
              title: 'Selecao e Due Diligence',
              text: 'Filtramos imoveis e realizamos uma analise juridica e financeira detalhada.',
            },
            {
              icon: <Landmark className="size-5 text-primary" />,
              title: 'Lances e Arremate',
              text: 'Acompanhamos voce durante o processo do leilao e orientamos na estrategia de lances.',
            },
            {
              icon: <Home className="size-5 text-primary" />,
              title: 'Regularizacao e Posse',
              text: 'Auxiliamos nos tramites apos o arremate ate a regularizacao e posse do imovel.',
            },
          ].map((item, index) => (
            <div
              key={item.title}
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </span>
                <div className="rounded-2xl bg-slate-100 p-2">{item.icon}</div>
              </div>
              <h3 className="text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        className="scroll-mt-24 rounded-[2.25rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-8 shadow-sm sm:p-10"
        id="servicos-diferenciais"
      >
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="space-y-6">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
              Diferenciais da Nexo
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Por que escolher a Nexo Leiloes?
            </h2>
            <div className="relative hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:block">
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
              <Image
                src="/images/analise-imovel.png"
                alt="Analise estrategica de imovel da Nexo"
                width={1200}
                height={900}
                className="h-[380px] w-full object-cover object-center"
                priority={false}
              />
              <div className="absolute inset-x-5 bottom-5 rounded-[1.4rem] border border-white/30 bg-white/92 p-4 shadow-lg backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  Curadoria inteligente
                </p>
                <p className="mt-2 text-sm leading-7 text-slate-700">
                  Oportunidades analisadas com foco em liquidez, seguranca juridica
                  e potencial real de valorizacao.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              'Analise juridica combinada com estrategia de investimento',
              'Identificacao de oportunidades reais com potencial de valorizacao',
              'Atendimento consultivo e acompanhamento especializado',
              'Avaliacao inicial do perfil do investidor',
              'Curadoria de ativos com maior liquidez e leitura de saida',
            ].map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5"
              >
                <div className="mt-0.5 rounded-xl bg-primary/10 p-2">
                  <CheckCircle2 className="size-5 text-primary" />
                </div>
                <p className="text-sm leading-7 text-slate-600">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}

function InfraChatHomeWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let attempts = 0;
    let intervalId = 0;

    const applyContext = () => {
      const infraChat = (window as InfraChatWindow).InfraChat;

      if (!infraChat) {
        attempts += 1;
        if (attempts >= 40) {
          window.clearInterval(intervalId);
        }
        return;
      }

      infraChat.setContext({
        title: 'nexo leiloes',
        theme: 'light',
        accent: '#ff6a00',
        transparent: true,
        id: 'd4993358-4644-43e8-b0db-fa8fb5669caf',
      });

      window.clearInterval(intervalId);
    };

    intervalId = window.setInterval(applyContext, 300);
    applyContext();

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Script
      id="infra-chat-widget"
      src="https://infrastudio.vercel.app/chat.js"
      strategy="afterInteractive"
      data-projeto="nexo"
      data-agente="agente-imovel"
    />
  );
}

function PropertyCard({
  isAdmin = false,
  property,
  onClick,
}: {
  isAdmin?: boolean;
  property: Property;
  onClick: () => void;
}) {
  const gallery = property.images?.length ? property.images : [property.image_url];
  const [imageIndex, setImageIndex] = useState(0);
  const currentImage = gallery[imageIndex] ?? property.image_url;

  const showPreviousImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setImageIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  };

  const showNextImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setImageIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
  };

  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={currentImage}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          alt={property.title}
          referrerPolicy="no-referrer"
          unoptimized
        />
        {gallery.length > 1 ? (
          <>
            <button
              type="button"
              onClick={showPreviousImage}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Ver imagem anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              type="button"
              onClick={showNextImage}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-slate-700 shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Ver proxima imagem"
            >
              <ChevronRight className="size-4" />
            </button>
          </>
        ) : null}
        <div className="absolute left-4 top-4 flex gap-2">
          <span className="rounded-lg bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white shadow-lg">
            {property.auction_type || 'Leilao'}
          </span>
          <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold uppercase text-white shadow-lg">
            {property.status || 'ativo'}
          </span>
        </div>
        {isAdmin ? (
          <div className="absolute right-4 top-4">
            <AdminEditPropertyLink propertyId={property.id} compact floating />
          </div>
        ) : null}
        {gallery.length > 1 ? (
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5 rounded-full bg-slate-950/45 px-2 py-1 backdrop-blur">
            {gallery.map((imageUrl, index) => (
              <span
                key={imageUrl}
                className={`size-1.5 rounded-full ${
                  index === imageIndex ? 'bg-white' : 'bg-white/45'
                }`}
              />
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(property.price)}
          </span>
          <div className="flex items-center gap-1 text-slate-500">
            <MapPin className="size-3" />
            <span className="text-xs">{property.location || 'Localizacao nao informada'}</span>
          </div>
        </div>
        <h4 className="mb-2 line-clamp-1 text-lg font-bold text-slate-900">
          {property.title}
        </h4>
        <p className="mb-4 line-clamp-2 text-sm text-slate-600">
          {property.description}
        </p>
        <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
          <div className="flex gap-4">
            <MiniMetric label="Quartos" value={formatMetric(property.beds)} />
            <MiniMetric label="Banheiros" value={formatMetric(property.baths)} />
            <MiniMetric label="Area" value={formatArea(property.sqft)} />
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-slate-800">
            Detalhes
          </button>
        </div>
      </div>
    </div>
  );
}

function ListingsView({
  isAdmin = false,
  isLoading,
  properties,
  onPropertyClick,
}: {
  isAdmin?: boolean;
  isLoading: boolean;
  properties: Property[];
  onPropertyClick: (p: Property) => void;
}) {
  const [query, setQuery] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [minBeds, setMinBeds] = useState('');
  const [minArea, setMinArea] = useState('');
  const [visibleCount, setVisibleCount] = useState(9);

  const filteredProperties = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const normalizedLocationFilter = locationFilter.trim().toLowerCase();
    const minPriceValue = minPrice ? Number(minPrice) : null;
    const maxPriceValue = maxPrice ? Number(maxPrice) : null;
    const minBedsValue = minBeds ? Number(minBeds) : null;
    const minAreaValue = minArea ? Number(minArea) : null;

    return properties.filter((property) => {
      const matchesQuery =
        !normalizedQuery ||
        [
          property.title,
          property.location,
          property.city ?? '',
          property.state ?? '',
          property.address ?? '',
          property.cep ?? '',
          property.type,
          property.auction_type ?? '',
          property.status ?? '',
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesLocation =
        !normalizedLocationFilter ||
        [property.location, property.city ?? '', property.state ?? '', property.address ?? '']
          .join(' ')
          .toLowerCase()
          .includes(normalizedLocationFilter);

      const matchesMinPrice =
        minPriceValue == null || property.price >= minPriceValue;

      const matchesMaxPrice =
        maxPriceValue == null || property.price <= maxPriceValue;

      const matchesBeds =
        minBedsValue == null || (property.beds ?? 0) >= minBedsValue;

      const matchesArea =
        minAreaValue == null || (property.sqft ?? 0) >= minAreaValue;

      return (
        matchesQuery &&
        matchesLocation &&
        matchesMinPrice &&
        matchesMaxPrice &&
        matchesBeds &&
        matchesArea
      );
    });
  }, [locationFilter, maxPrice, minArea, minBeds, minPrice, properties, query]);

  useEffect(() => {
    setVisibleCount(9);
  }, [query, locationFilter, minPrice, maxPrice, minBeds, minArea]);

  const visibleProperties = filteredProperties.slice(0, visibleCount);
  const hasMoreFilteredProperties = visibleCount < filteredProperties.length;

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Buscar Propriedades
            </label>
            <div className="group relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-primary">
                <Search className="size-5" />
              </div>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="block w-full rounded-xl border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-primary/20"
                placeholder="Buscar por cidade, bairro, CEP ou titulo"
                type="text"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsFilterOpen((current) => !current)}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-4 text-sm font-bold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
          >
            <Filter className="size-4" />
            Filtros
            <ChevronDown
              className={`size-4 transition ${isFilterOpen ? 'rotate-180' : ''}`}
            />
          </button>
        </div>

        <AnimatePresence initial={false}>
          {isFilterOpen ? (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -8 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -8 }}
              className="overflow-hidden"
            >
              <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <FilterField
                    label="Localizacao"
                    value={locationFilter}
                    onChange={setLocationFilter}
                    placeholder="Cidade, estado ou bairro"
                  />
                  <FilterField
                    label="Valor minimo"
                    value={minPrice}
                    onChange={setMinPrice}
                    placeholder="Ex: 100000"
                    type="number"
                  />
                  <FilterField
                    label="Valor maximo"
                    value={maxPrice}
                    onChange={setMaxPrice}
                    placeholder="Ex: 800000"
                    type="number"
                  />
                  <FilterField
                    label="Min. quartos"
                    value={minBeds}
                    onChange={setMinBeds}
                    placeholder="Ex: 3"
                    type="number"
                  />
                  <FilterField
                    label="Area minima (m2)"
                    value={minArea}
                    onChange={setMinArea}
                    placeholder="Ex: 120"
                    type="number"
                  />
                </div>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-500">
                    {filteredProperties.length}{' '}
                    {filteredProperties.length === 1
                      ? 'imovel encontrado'
                      : 'imoveis encontrados'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setLocationFilter('');
                      setMinPrice('');
                      setMaxPrice('');
                      setMinBeds('');
                      setMinArea('');
                    }}
                    className="text-sm font-semibold text-primary transition hover:text-primary/80"
                  >
                    Limpar filtros
                  </button>
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Carregando imoveis...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Nenhum imovel encontrado para essa busca.
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {visibleProperties.map((property) => (
              <PropertyCard
                key={property.id}
                isAdmin={isAdmin}
                property={property}
                onClick={() => onPropertyClick(property)}
              />
            ))}
          </div>

          {hasMoreFilteredProperties ? (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setVisibleCount((current) => current + 9)}
                className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:border-primary/30 hover:text-primary"
              >
                Carregar mais 9 imoveis
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

function FilterField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
      />
    </label>
  );
}

function PropertyDetailsView({
  property,
  user,
  onBack,
}: {
  property: Property;
  user: UserType | null;
  onBack: () => void;
}) {
  const [activeImage, setActiveImage] = useState(property.image_url);
  const isAdmin = user?.tipo_usuario === 'admin';
  const [hasUnlockedPremium, setHasUnlockedPremium] = useState(false);
  const [activePremiumTab, setActivePremiumTab] = useState<'geral' | 'dossie' | 'analise' | 'arquivos'>('geral');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isDesktopChatVisible, setIsDesktopChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatConversationId, setChatConversationId] = useState<string | null>(null);
  const [isSubmittingChat, setIsSubmittingChat] = useState(false);
  const [isLoadingChatHistory, setIsLoadingChatHistory] = useState(false);
  const [hasAttemptedHistoryLoad, setHasAttemptedHistoryLoad] = useState(false);

  useEffect(() => {
    setActiveImage(property.image_url);
    setHasUnlockedPremium(false);
    setActivePremiumTab('geral');
    setIsMobileChatOpen(false);
    setIsDesktopChatVisible(false);
    setChatMessages(createInitialChatMessages(property.title));
    setChatInput('');
    setChatConversationId(null);
    setIsSubmittingChat(false);
    setIsLoadingChatHistory(false);
    setHasAttemptedHistoryLoad(false);
  }, [property.id, property.image_url]);

  useEffect(() => {
    if (!hasUnlockedPremium || !user?.id || hasAttemptedHistoryLoad) {
      return;
    }

    let isCancelled = false;

    async function loadChatHistory() {
      try {
        setIsLoadingChatHistory(true);

        const response = await fetch(
          `/api/chat/imovel?propertyId=${encodeURIComponent(property.id)}`,
          { cache: 'no-store' },
        );

        const data = (await response.json()) as {
          conversationId?: string | null;
          messages?: ChatMessage[];
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error || 'Falha ao carregar historico do chat.');
        }

        if (isCancelled) {
          return;
        }

        if ((data.messages?.length ?? 0) > 0) {
          setChatMessages(data.messages ?? []);
          setChatConversationId(data.conversationId ?? null);
        } else {
          setChatMessages(createInitialChatMessages(property.title));
          setChatConversationId(null);
        }
      } catch (error) {
        console.error(error);

        if (!isCancelled) {
          setChatMessages(createInitialChatMessages(property.title));
          setChatConversationId(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingChatHistory(false);
          setHasAttemptedHistoryLoad(true);
        }
      }
    }

    loadChatHistory();

    return () => {
      isCancelled = true;
    };
  }, [hasAttemptedHistoryLoad, hasUnlockedPremium, property.id, property.title, user?.id]);

  const gallery = property.images?.length ? property.images : [property.image_url];

  const handleUnlockInformation = () => {
    setHasUnlockedPremium(true);
    setActivePremiumTab('dossie');
    setIsMobileChatOpen(true);
    setIsDesktopChatVisible(true);
  };

  const submitChatMessage = async () => {
    const trimmedInput = chatInput.trim();

    if (!trimmedInput || isSubmittingChat || isLoadingChatHistory) {
      return;
    }

    setChatMessages((current) => [...current, { role: 'user', text: trimmedInput }]);
    setChatInput('');

    try {
      setIsSubmittingChat(true);

      const response = await fetch('/api/chat/imovel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: property.id,
          message: trimmedInput,
          conversationId: chatConversationId,
        }),
      });

      const data = (await response.json()) as {
        conversationId?: string;
        reply?: string;
        error?: string;
      };

      if (!response.ok || !data.reply) {
        throw new Error(data.error || 'Falha ao responder no chat.');
      }

      setChatConversationId(data.conversationId ?? null);
      setChatMessages((current) => [...current, { role: 'model', text: data.reply ?? '' }]);
    } catch (error) {
      console.error(error);
      setChatMessages((current) => [
        ...current,
        {
          role: 'model',
          text: 'Nao consegui responder agora. Tente novamente em alguns instantes.',
        },
      ]);
    } finally {
      setIsSubmittingChat(false);
    }
  };

  return (
    <>
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 font-medium text-slate-500 transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-4" />
          Voltar para Imoveis
        </button>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="space-y-4">
            <div className="relative aspect-video overflow-hidden rounded-2xl shadow-xl">
              <Image
                src={activeImage}
                fill
                className="object-cover"
                alt={property.title}
                referrerPolicy="no-referrer"
                unoptimized
              />
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white shadow-lg">
                  {property.auction_type || 'Leilao'}
                </span>
                <span className="rounded-full bg-slate-900 px-3 py-1 text-sm font-semibold text-white shadow-lg">
                  {property.status || 'ativo'}
                </span>
              </div>
            </div>

            {gallery.length > 1 ? (
              <div className="grid grid-cols-4 gap-3 sm:grid-cols-5">
                {gallery.map((imageUrl) => (
                  <button
                    key={imageUrl}
                    type="button"
                    onClick={() => setActiveImage(imageUrl)}
                    className={`relative aspect-[4/3] overflow-hidden rounded-2xl border transition ${
                      activeImage === imageUrl
                        ? 'border-primary shadow-lg shadow-primary/20'
                        : 'border-slate-200'
                    }`}
                  >
                    <Image
                      src={imageUrl}
                      alt="Miniatura do imovel"
                      fill
                      className="object-cover"
                      referrerPolicy="no-referrer"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="lg:h-full">
          <div className="flex h-full flex-col space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Resumo do Imovel</h3>
            <div className="space-y-4">
              <SummaryRow label="Valor minimo" value={formatCurrency(property.price)} valueClassName="text-primary" />
              <SummaryRow
                label="Valor de avaliacao"
                value={property.valuation_price == null ? '-' : formatCurrency(property.valuation_price)}
              />
              <SummaryRow label="Tipo de propriedade" value={property.type} />
              <SummaryRow label="Tipo de leilao" value={property.auction_type || '-'} />
              <SummaryRow label="Status" value={property.status || '-'} />
              <SummaryRow label="Data do leilao" value={formatDate(property.auction_date)} />
              <SummaryRow label="Area construida" value={formatArea(property.built_area)} />
              <SummaryRow label="CEP" value={property.cep || '-'} />
            </div>
            <div className="mt-auto space-y-3">
              <button
                type="button"
                onClick={handleUnlockInformation}
                className="w-full rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
              >
                Solicitar Informacoes
              </button>
              {isAdmin ? (
                <AdminEditPropertyLink propertyId={property.id} className="w-full justify-center" />
              ) : null}
              <div className="flex gap-2">
                <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50">
                  <Share2 className="size-4" /> Compartilhar
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50">
                  <Heart className="size-4" /> Salvar
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {hasUnlockedPremium ? (
            <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { key: 'geral', label: 'Informacoes basicas' },
                { key: 'dossie', label: 'Visao geral' },
                { key: 'analise', label: 'Dossie' },
                { key: 'arquivos', label: 'Arquivos' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActivePremiumTab(
                      tab.key as 'geral' | 'dossie' | 'analise' | 'arquivos',
                    )
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-center text-sm font-bold transition ${
                    activePremiumTab === tab.key
                      ? 'border-primary text-primary shadow-sm'
                      : 'border-slate-200 bg-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}

          {(!hasUnlockedPremium || activePremiumTab === 'geral') ? (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h1 className="mb-2 text-3xl font-bold tracking-tight">{property.title}</h1>
                  <p className="flex items-center gap-2 text-lg text-slate-500">
                    <MapPin className="size-5 text-primary" />
                    {property.address || property.location || 'Endereco nao informado'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(property.price)}
                  </p>
                  <p className="text-sm text-slate-400">
                    {property.location || 'Localizacao nao informada'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <FactCard
                  icon={<Bed className="mx-auto mb-1 size-5 text-primary" />}
                  label="Quartos"
                  value={formatMetric(property.beds)}
                />
                <FactCard
                  icon={<Bath className="mx-auto mb-1 size-5 text-primary" />}
                  label="Banheiros"
                  value={formatMetric(property.baths)}
                />
                <FactCard
                  icon={<Square className="mx-auto mb-1 size-5 text-primary" />}
                  label="Total (m2)"
                  value={formatArea(property.sqft)}
                />
                <FactCard
                  icon={<Calendar className="mx-auto mb-1 size-5 text-primary" />}
                  label="Construido"
                  value={property.year_built ?? '-'}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-bold">Descricao</h3>
                <p className="leading-relaxed text-slate-600">{property.description}</p>
              </div>
            </div>
          ) : null}

          {hasUnlockedPremium && activePremiumTab === 'dossie' ? (
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-2">
              <DetailPanelCard
                label="Resumo executivo"
                value={property.dossier?.resumo_executivo}
              />
              <DetailPanelCard
                label="Ocupacao"
                value={property.dossier?.ocupacao}
              />
              <DetailPanelCard
                label="Matricula"
                value={property.dossier?.matricula}
              />
              <DetailPanelCard
                label="Cartorio"
                value={property.dossier?.cartorio}
              />
              <DetailPanelCard
                label="Numero do processo"
                value={property.dossier?.numero_processo}
              />
              <DetailPanelCard
                label="Valor de mercado"
                value={formatOptionalCurrency(property.dossier?.valor_mercado)}
              />
              <DetailPanelCard
                label="Lance recomendado"
                value={formatOptionalCurrency(property.dossier?.lance_recomendado)}
              />
              <DetailPanelCard
                label="Lucro estimado"
                value={formatOptionalCurrency(property.dossier?.lucro_estimado)}
              />
              <DetailPanelCard
                label="ROI estimado"
                value={formatPercent(property.dossier?.roi_estimado)}
              />
              <DetailPanelCard
                label="Divida de IPTU"
                value={formatOptionalCurrency(property.dossier?.divida_iptu)}
              />
              <DetailPanelCard
                label="Divida de condominio"
                value={formatOptionalCurrency(property.dossier?.divida_condominio)}
              />
            </div>
          ) : null}

          {hasUnlockedPremium && activePremiumTab === 'analise' ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <LongDetailBlock
                label="Analise do investimento"
                value={property.dossier?.analise}
              />
              <LongDetailBlock
                label="Riscos"
                value={property.dossier?.riscos}
              />
              <LongDetailBlock
                label="Observacoes juridicas"
                value={property.dossier?.observacoes_juridicas}
              />
              <LongDetailBlock
                label="Estrategia recomendada"
                value={property.dossier?.estrategia}
              />
            </div>
          ) : null}

          {hasUnlockedPremium && activePremiumTab === 'arquivos' ? (
            <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              {property.dossier_files?.length ? (
                property.dossier_files.map((file) => (
                  <div
                    key={file.id}
                    className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {file.nome_arquivo || 'Arquivo sem nome'}
                      </p>
                      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                        {file.tipo_documento || 'Documento'}
                      </p>
                    </div>
                    {file.url_storage ? (
                      <a
                        href={file.url_storage}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-bold text-primary transition hover:text-primary/80"
                      >
                        Abrir arquivo
                      </a>
                    ) : null}
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
                  Nenhum arquivo complementar cadastrado para este imovel.
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className="lg:self-start">
          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Localizacao</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              {property.address || 'Endereco nao informado'}
            </p>
            <p className="text-sm leading-relaxed text-slate-500">
              {property.location || 'Cidade e estado nao informados'}
            </p>
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <iframe
                title={`Mapa de ${property.title}`}
                src={`https://www.google.com/maps?q=${encodeURIComponent(
                  [property.address, property.location].filter(Boolean).join(', '),
                )}&output=embed`}
                className="h-72 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>
        </div>
      </div>
      </motion.div>

      <PropertyChatAssistant
        isEnabled={hasUnlockedPremium}
        isDesktopVisible={isDesktopChatVisible}
        isMobileOpen={isMobileChatOpen}
        property={property}
        messages={chatMessages}
        input={chatInput}
        onInputChange={setChatInput}
        onSubmit={submitChatMessage}
        isSubmitting={isSubmittingChat}
        isLoadingHistory={isLoadingChatHistory}
        onDesktopMinimize={() => setIsDesktopChatVisible(false)}
        onDesktopExpand={() => setIsDesktopChatVisible(true)}
        onDesktopClose={() => setIsDesktopChatVisible(false)}
        onMobileClose={() => setIsMobileChatOpen(false)}
      />
    </>
  );
}

function PropertyChatAssistant({
  isEnabled,
  isDesktopVisible,
  isMobileOpen,
  property,
  messages,
  input,
  onInputChange,
  onSubmit,
  isSubmitting,
  isLoadingHistory,
  onDesktopMinimize,
  onDesktopExpand,
  onDesktopClose,
  onMobileClose,
}: {
  isEnabled: boolean;
  isDesktopVisible: boolean;
  isMobileOpen: boolean;
  property: Property;
  messages: ChatMessage[];
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting: boolean;
  isLoadingHistory: boolean;
  onDesktopMinimize: () => void;
  onDesktopExpand: () => void;
  onDesktopClose: () => void;
  onMobileClose: () => void;
}) {
  return (
    <AnimatePresence>
      {isEnabled ? (
        <>
          {isMobileOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] bg-slate-950/45 backdrop-blur-sm lg:hidden"
              onClick={onMobileClose}
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-x-4 bottom-4 top-auto mx-auto flex max-h-[85vh] w-auto max-w-2xl flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl sm:inset-x-6"
                onClick={(event) => event.stopPropagation()}
              >
                <ChatPanelHeader
                  propertyTitle={property.title}
                  onClose={onMobileClose}
                />
                <ChatMessages messages={messages} isLoadingHistory={isLoadingHistory} />
                <ChatComposer
                  input={input}
                  onChange={onInputChange}
                  onSubmit={onSubmit}
                  isSubmitting={isSubmitting}
                  isLoadingHistory={isLoadingHistory}
                />
              </motion.div>
            </motion.div>
          ) : null}

          <div className="fixed bottom-6 right-6 z-[70] hidden lg:block">
            {!isDesktopVisible ? (
              <button
                type="button"
                onClick={onDesktopExpand}
                className="inline-flex items-center gap-3 rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-2xl shadow-slate-900/20 transition hover:bg-slate-900"
              >
                <MessageCircle className="size-5" />
                Abrir assistente
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 24, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="flex h-[70vh] max-h-[680px] w-[420px] flex-col overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl shadow-slate-900/15"
              >
                <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80">
                      Atendimento do imovel
                    </p>
                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {property.title}
                    </h3>
                  </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onDesktopMinimize}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <MessageCircle className="size-4" />
                    </button>
                  <button
                    type="button"
                    onClick={onDesktopClose}
                    className="inline-flex size-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <X className="size-5" />
                    </button>
                  </div>
                </div>
                <ChatMessages messages={messages} isLoadingHistory={isLoadingHistory} />
                <ChatComposer
                  input={input}
                  onChange={onInputChange}
                  onSubmit={onSubmit}
                  isSubmitting={isSubmitting}
                  isLoadingHistory={isLoadingHistory}
                />
              </motion.div>
            )}
          </div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function DetailPanelCard({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value || '-'}</p>
    </div>
  );
}

function LongDetailBlock({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </p>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
        {value || 'Nenhuma informacao cadastrada ate o momento.'}
      </p>
    </div>
  );
}

function ChatPanelHeader({
  propertyTitle,
  onClose,
}: {
  propertyTitle: string;
  onClose: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-primary/80">
          Atendimento do imovel
        </p>
        <h3 className="mt-2 text-xl font-bold text-slate-900">{propertyTitle}</h3>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="inline-flex size-10 items-center justify-center rounded-2xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}

function ChatMessages({
  messages,
  isLoadingHistory,
}: {
  messages: ChatMessage[];
  isLoadingHistory: boolean;
}) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-6 py-5">
      {isLoadingHistory ? (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <LoaderCircle className="size-4 animate-spin" />
          Carregando historico da conversa...
        </div>
      ) : null}
      {messages.map((message, index) => (
        <div
          key={`${message.role}-${index}`}
          className={`flex ${
            message.role === 'user' ? 'justify-end' : 'justify-start'
          }`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 shadow-sm ${
              message.role === 'user'
                ? 'bg-primary text-white'
                : 'border border-slate-200 bg-white text-slate-700'
            }`}
          >
            {message.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function ChatComposer({
  input,
  onChange,
  onSubmit,
  isSubmitting,
  isLoadingHistory,
}: {
  input: string;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  isSubmitting: boolean;
  isLoadingHistory: boolean;
}) {
  return (
    <div className="border-t border-slate-200 bg-white px-6 py-5">
      <div className="flex items-end gap-3">
        <textarea
          value={input}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          placeholder={
            isLoadingHistory
              ? 'Carregando historico da conversa...'
              : 'Escreva sua mensagem sobre este imovel'
          }
          disabled={isSubmitting || isLoadingHistory}
          className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting || isLoadingHistory}
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          {isSubmitting || isLoadingHistory ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
}

function createInitialChatMessages(propertyTitle: string): ChatMessage[] {
  return [
    {
      role: 'model',
      text: `Oi! Posso te ajudar com informacoes sobre ${propertyTitle}. Pergunte sobre valor, leilao, localizacao ou caracteristicas do imovel.`,
    },
  ];
}

function AdminEditPropertyLink({
  propertyId,
  compact = false,
  className = '',
  floating = false,
}: {
  propertyId: string;
  compact?: boolean;
  className?: string;
  floating?: boolean;
}) {
  return (
    <Link
      href={`/admin/imoveis/${propertyId}`}
      onClick={(event) => event.stopPropagation()}
      className={[
        'inline-flex items-center rounded-xl font-bold transition',
        floating
          ? 'border border-white/40 bg-white/90 text-primary shadow-lg backdrop-blur hover:bg-white'
          : 'border border-primary/20 bg-primary/10 text-primary hover:border-primary/30 hover:bg-primary/15',
        compact ? 'px-3 py-2 text-xs' : 'px-4 py-3 text-sm',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      Editar imovel
    </Link>
  );
}

function UserAvatar({ email }: { email: string }) {
  const initial = email.trim().charAt(0).toUpperCase() || 'U';

  return (
    <div className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[11px] font-bold text-white">
      {/[A-Z0-9]/.test(initial) ? initial : <UserRound className="size-4" />}
    </div>
  );
}

function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
        {label}
      </span>
      <span className="text-sm font-bold">{value}</span>
    </div>
  );
}

function FactCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
      {icon}
      <p className="text-xs font-bold uppercase text-slate-500">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className={`text-right font-bold ${valueClassName ?? ''}`}>{value}</span>
    </div>
  );
}

function formatCurrency(value: number | null | undefined) {
  return (value ?? 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function formatOptionalCurrency(value: number | null | undefined) {
  if (value == null) {
    return '-';
  }

  return formatCurrency(value);
}

function formatMetric(value: number | null | undefined) {
  return value == null ? '-' : String(value);
}

function formatArea(value: number | null | undefined) {
  return value == null ? '-' : `${value} m2`;
}

function formatPercent(value: number | null | undefined) {
  return value == null ? '-' : `${value}%`;
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
