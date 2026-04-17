'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bath,
  Bed,
  BookText,
  Calendar,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Filter,
  File,
  FileBadge2,
  FileSearch,
  Gavel,
  Heart,
  Home,
  Landmark,
  Map,
  MapPin,
  Menu,
  MessageCircle,
  PiggyBank,
  Receipt,
  Scale,
  Search,
  Share2,
  ShieldCheck,
  Square,
  Target,
  TrendingUp,
  UserRound,
  Wallet,
  UserCog,
  X,
} from 'lucide-react';
import { logoutAction } from '@/app/actions/auth';
import { BrandLogo } from '@/components/brand-logo';
import { Property, User as UserType } from '@/lib/types';
import { SiteFooter } from '@/components/site-footer';
import { PropertyDescription } from '@/components/property-description';

type InfraChatWindow = Window & {
  InfraChat?: {
    destroy?: () => void;
    destroyAll?: () => void;
  };
  InfraChatWidget?: {
    destroy?: (slug: string) => boolean;
    destroyAll?: () => void;
  };
  __infraChatScriptPromise__?: Promise<void>;
  __infraChatFetchPatched__?: boolean;
  __infraChatOriginalFetch__?: typeof window.fetch;
};

const INFRA_CHAT_WIDGET_ID = 'infra-chat-widget';
const INFRA_CHAT_WIDGET_SLUG = 'nexo_leiloes';
const INFRA_CHAT_API_BASE = 'https://www.infrastudio.pro';
const INFRA_CHAT_PROJECT = 'nexo';
const INFRA_CHAT_AGENT = 'agente-imovel';

function cleanupInfraChatWidget() {
  if (typeof window === 'undefined') {
    return;
  }

  const infraWindow = window as InfraChatWindow;

  try {
    infraWindow.InfraChatWidget?.destroy?.(INFRA_CHAT_WIDGET_SLUG);
    infraWindow.InfraChat?.destroy?.();
    infraWindow.InfraChatWidget?.destroyAll?.();
    infraWindow.InfraChat?.destroyAll?.();
  } catch (error) {
    console.error('Failed to cleanup InfraChat widget', error);
  }

  document
    .querySelectorAll(
      [
        `#${INFRA_CHAT_WIDGET_ID}`,
        `[id="infrastudio-chat-widget-root-${INFRA_CHAT_WIDGET_SLUG}"]`,
      ].join(','),
    )
    .forEach((element) => element.remove());
}

function ensureInfraChatFetchCompatibility() {
  if (typeof window === 'undefined') {
    return;
  }

  const infraWindow = window as InfraChatWindow;

  if (infraWindow.__infraChatFetchPatched__) {
    return;
  }

  infraWindow.__infraChatOriginalFetch__ = window.fetch.bind(window);
  window.fetch = async (input: URL | RequestInfo, init?: RequestInit) => {
    const requestUrl =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    const isInfraChatRequest = requestUrl === `${INFRA_CHAT_API_BASE}/api/chat`;
    const canPatchBody = Boolean(init?.body) && (!init?.method || init.method.toUpperCase() === 'POST');

    if (!isInfraChatRequest || !canPatchBody) {
      return infraWindow.__infraChatOriginalFetch__!(input, init);
    }

    try {
      const parsedBody = JSON.parse(String(init?.body));

      if (parsedBody?.widgetSlug !== INFRA_CHAT_WIDGET_SLUG) {
        return infraWindow.__infraChatOriginalFetch__!(input, init);
      }

      const nextInit: RequestInit = {
        ...init,
        body: JSON.stringify({
          ...parsedBody,
          projeto: parsedBody.projeto ?? INFRA_CHAT_PROJECT,
          agente: parsedBody.agente ?? INFRA_CHAT_AGENT,
        }),
      };

      return infraWindow.__infraChatOriginalFetch__!(input, nextInit);
    } catch {
      return infraWindow.__infraChatOriginalFetch__!(input, init);
    }
  };

  infraWindow.__infraChatFetchPatched__ = true;
}

function loadInfraChatScript() {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  const infraWindow = window as InfraChatWindow;

  if (infraWindow.InfraChat) {
    return Promise.resolve();
  }

  if (infraWindow.__infraChatScriptPromise__) {
    return infraWindow.__infraChatScriptPromise__;
  }

  ensureInfraChatFetchCompatibility();

  infraWindow.__infraChatScriptPromise__ = new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById(INFRA_CHAT_WIDGET_ID);

    if (existingScript) {
      if (infraWindow.InfraChatWidget) {
        resolve();
        return;
      }

      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener(
        'error',
        () => reject(new Error('Failed to load InfraChat script.')),
        { once: true },
      );
      return;
    }

    const script = document.createElement('script');
    script.id = INFRA_CHAT_WIDGET_ID;
    script.src = `${INFRA_CHAT_API_BASE}/chat-widget.js`;
    script.defer = true;
    script.dataset.widget = INFRA_CHAT_WIDGET_SLUG;
    script.dataset.title = 'nexo leiloes';
    script.dataset.theme = 'light';
    script.dataset.accent = '#2c6ef1';
    script.dataset.transparent = 'true';
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener(
      'error',
      () => reject(new Error('Failed to load InfraChat script.')),
      { once: true },
    );
    document.body.appendChild(script);
  }).finally(() => {
    delete infraWindow.__infraChatScriptPromise__;
  });

  return infraWindow.__infraChatScriptPromise__;
}

function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  minDistance = 44,
}: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  minDistance?: number;
}) {
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (event: React.TouchEvent<HTMLElement>) => {
    const touch = event.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: React.TouchEvent<HTMLElement>) => {
    const touchStart = touchStartRef.current;
    const touch = event.changedTouches[0];
    touchStartRef.current = null;

    if (!touchStart || !touch) {
      return false;
    }

    const deltaX = touch.clientX - touchStart.x;
    const deltaY = touch.clientY - touchStart.y;

    if (Math.abs(deltaX) < minDistance || Math.abs(deltaX) < Math.abs(deltaY)) {
      return false;
    }

    if (deltaX < 0) {
      onSwipeLeft();
    } else {
      onSwipeRight();
    }

    return true;
  };

  return {
    swipeHandlers: {
      onTouchStart: handleTouchStart,
      onTouchEnd: handleTouchEnd,
    },
  };
}

const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000';

const HOME_MENU_ITEMS: ReadonlyArray<{
  label: string;
  id: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { label: 'Home', id: 'topo', icon: Home },
  { label: 'Sobre Nós', id: 'sobre', icon: Building2 },
  { label: 'Serviços', id: 'servicos', icon: BriefcaseBusiness },
  { label: 'Oportunidades', id: 'planos', icon: ClipboardList },
  { label: 'FAQ', id: 'faq', icon: BookText },
] as const;

const ABOUT_PILLARS = [
  'Democratizamos o acesso aos leilões de imóveis com suporte claro, humano e estratégico.',
  'Atuamos como ponte entre clientes e oportunidades de alto valor com leitura jurídica, financeira e operacional.',
  'Nossa prioridade é garantir segurança, transparência e previsibilidade para famílias e investidores.',
] as const;

const HISTORY_HIGHLIGHTS = [
  {
    eyebrow: 'Nossa história',
    title: 'Uma ponte segura para quem quer comprar melhor',
    text: 'A Nexo Leilões nasceu para abrir as portas dos leilões de imóveis a quem busca a casa própria ou deseja investir com segurança, critério e acesso a informações confiáveis.',
  },
  {
    eyebrow: 'Origem',
    title: 'Visão construída a partir de oportunidades perdidas',
    text: 'Servolo Tobias percebeu que famílias e investidores deixavam bons negócios para trás por falta de informação, confiança e leitura técnica do processo.',
  },
  {
    eyebrow: 'Método',
    title: 'Análise profunda para reduzir risco e ampliar ganho',
    text: 'Cada oportunidade passa por estudo detalhado do edital, matrícula, custos, cenários e estratégia de arremate para evitar surpresas e elevar a qualidade da decisão.',
  },
] as const;

const BRAND_VALUES = [
  'Transparência',
  'Acessibilidade',
  'Segurança',
  'Compromisso',
  'Oportunidade',
  'Humanização',
  'Ética',
] as const;

const FAQ_ITEMS = [
  {
    question: 'O que é um leilão de imóveis?',
    answer:
      'É uma forma de venda pública em que imóveis são disponibilizados por decisão judicial ou extrajudicial, geralmente com valores abaixo do mercado.',
  },
  {
    question: 'Posso participar de um leilão mesmo sem experiência?',
    answer:
      'Sim. Nossa plataforma ajuda investidores iniciantes e experientes, oferecendo informações claras e assessoria completa em todas as etapas.',
  },
  {
    question: 'Os imóveis têm desconto real?',
    answer:
      'Sim. Em muitos casos os imóveis são vendidos com descontos de 30% a 70% em relação ao valor de mercado.',
  },
  {
    question: 'Preciso pagar para acessar as informações?',
    answer:
      'Você pode visualizar informações básicas gratuitamente. Para liberar um relatório detalhado, existe um pagamento simbólico com dados como matrícula, parecer jurídico e análise de rentabilidade.',
  },
  {
    question: 'Como funciona o relatório básico?',
    answer:
      'Após o pagamento, você recebe automaticamente um PDF com data do leilão, valor de avaliação e lance mínimo, percentual de desconto, matrícula resumida, breve parecer jurídico e margem de ganho estimada.',
  },
  {
    question: 'O que acontece se eu quiser mais detalhes após o relatório básico?',
    answer:
      'Você pode contratar nossa assessoria completa para aprofundar a análise jurídica, representação no leilão e regularização do imóvel.',
  },
  {
    question: 'Os valores informados incluem todas as taxas?',
    answer:
      'Nos relatórios indicamos os principais custos envolvidos, como ITBI, dívidas e taxas cartorárias, para que você tenha uma visão mais real do investimento.',
  },
  {
    question: 'Posso perder dinheiro em um leilão?',
    answer:
      'Como em qualquer investimento, existem riscos. Nossa assessoria reduz significativamente esse risco com segurança jurídica, leitura de mercado e estratégia.',
  },
  {
    question: 'A plataforma divulga quem é o leiloeiro?',
    answer:
      'Não. Nosso objetivo é centralizar oportunidades e entregar a análise pronta, sem expor diretamente os leiloeiros.',
  },
  {
    question: 'Como é feito o pagamento da taxa simbólica?',
    answer:
      'O pagamento pode ser feito via Pix, cartão de crédito ou boleto diretamente na plataforma, de forma segura.',
  },
  {
    question: 'Vocês me representam no leilão?',
    answer:
      'Sim. Na assessoria completa, nossa equipe acompanha o processo desde os lances até a finalização da arrematação.',
  },
  {
    question: 'O que acontece se o imóvel estiver ocupado?',
    answer:
      'No relatório informamos a situação do imóvel. Se estiver ocupado, nossa assessoria pode estruturar estratégias jurídicas para desocupação ou negociação.',
  },
  {
    question: 'Eu posso visitar o imóvel antes de comprar?',
    answer:
      'Na maioria dos casos, não. Por isso analisamos matrícula, fotos oficiais, localização e outros dados para oferecer a melhor leitura possível do ativo.',
  },
  {
    question: 'Vocês garantem que vou ter lucro?',
    answer:
      'Não existe garantia absoluta. Nosso trabalho é identificar imóveis com alto potencial de rentabilidade e entregar as informações necessárias para uma decisão segura.',
  },
  {
    question: 'Posso parcelar o valor do imóvel em leilão?',
    answer:
      'Alguns leilões permitem parcelamento e outros exigem pagamento à vista. Essa condição sempre é informada no relatório do imóvel.',
  },
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
  const pathname = usePathname();
  const [view, setView] = useState<'home' | 'listings' | 'details'>(initialView);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeChatPropertyId, setActiveChatPropertyId] = useState<string | null>(null);
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
      setActiveChatPropertyId(null);
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

    let ticking = false;

    const updateActiveSection = () => {
      const referenceLine = window.innerHeight * 0.28;
      let currentSectionId = sections[0]?.id ?? 'topo';

      for (const section of sections) {
        const rect = section.getBoundingClientRect();

        if (rect.top - referenceLine <= 0) {
          currentSectionId = section.id;
        } else {
          break;
        }
      }

      setActiveSection((current) =>
        current === currentSectionId ? current : currentSectionId,
      );
      ticking = false;
    };

    const requestSectionUpdate = () => {
      if (ticking) {
        return;
      }

      ticking = true;
      window.requestAnimationFrame(updateActiveSection);
    };

    requestSectionUpdate();
    window.addEventListener('scroll', requestSectionUpdate, { passive: true });
    window.addEventListener('resize', requestSectionUpdate);

    return () => {
      window.removeEventListener('scroll', requestSectionUpdate);
      window.removeEventListener('resize', requestSectionUpdate);
    };
  }, [view, properties.length]);

  useEffect(() => {
    const isPropertyDetailPath = /^\/imoveis\/[^/]+$/.test(pathname);

    if (view !== 'details' || !isPropertyDetailPath) {
      setActiveChatPropertyId(null);
      cleanupInfraChatWidget();
    }
  }, [pathname, view]);

  useEffect(() => {
    if (!selectedProperty || activeChatPropertyId === selectedProperty.id) {
      return;
    }

    setActiveChatPropertyId(null);
  }, [activeChatPropertyId, selectedProperty]);

  const handleMenuNavigation = (sectionId: string) => {
    cleanupInfraChatWidget();
    setIsMenuOpen(false);
    setView('home');
    setSelectedProperty(null);
    setActiveChatPropertyId(null);

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
    setActiveChatPropertyId(null);
    setSelectedProperty(property);
    setView('details');
    router.push(`/imoveis/${property.id}`);
  };

  const handleBrowse = () => {
    cleanupInfraChatWidget();
    setView('listings');
    setSelectedProperty(null);
    setActiveChatPropertyId(null);
    router.push('/imoveis');
  };

  const handleGoHome = () => {
    cleanupInfraChatWidget();
    setView('home');
    setSelectedProperty(null);
    setActiveChatPropertyId(null);
    router.push('/');
  };

  const adminHref = user?.tipo_usuario === 'admin' ? '/admin' : null;
  const isDetailPending =
    view === 'details' && Boolean(initialPropertyId) && selectedProperty === null;
  const isContentReady = !isLoadingProperties && !isDetailPending;

  const handleBackToListings = () => {
    cleanupInfraChatWidget();
    setView('listings');
    setSelectedProperty(null);
    setActiveChatPropertyId(null);
    router.push('/imoveis');
  };

  const isPropertyDetailPath = /^\/imoveis\/[^/]+$/.test(pathname);
  const isChatEnabled =
    view === 'details' &&
    isPropertyDetailPath &&
    Boolean(selectedProperty) &&
    activeChatPropertyId != null &&
    activeChatPropertyId === selectedProperty?.id;

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

  const similarProperties = useMemo(() => {
    if (!selectedProperty) {
      return [];
    }

    const selectedPrice = selectedProperty.price || 0;

    return properties
      .filter((property) => property.id !== selectedProperty.id)
      .map((property) => {
        let score = 0;

        if (
          property.type &&
          selectedProperty.type &&
          property.type.toLowerCase() === selectedProperty.type.toLowerCase()
        ) {
          score += 4;
        }

        if (
          property.city &&
          selectedProperty.city &&
          property.city.toLowerCase() === selectedProperty.city.toLowerCase()
        ) {
          score += 3;
        }

        if (
          property.state &&
          selectedProperty.state &&
          property.state.toLowerCase() === selectedProperty.state.toLowerCase()
        ) {
          score += 1;
        }

        if (
          property.auction_type &&
          selectedProperty.auction_type &&
          property.auction_type.toLowerCase() ===
            selectedProperty.auction_type.toLowerCase()
        ) {
          score += 2;
        }

        if (
          property.beds != null &&
          selectedProperty.beds != null &&
          property.beds === selectedProperty.beds
        ) {
          score += 1;
        }

        if (
          property.baths != null &&
          selectedProperty.baths != null &&
          property.baths === selectedProperty.baths
        ) {
          score += 1;
        }

        if (
          property.sqft != null &&
          selectedProperty.sqft != null &&
          Math.abs(property.sqft - selectedProperty.sqft) <= 25
        ) {
          score += 1;
        }

        if (selectedPrice > 0 && property.price > 0) {
          const priceDifferenceRatio =
            Math.abs(property.price - selectedPrice) / selectedPrice;

          if (priceDifferenceRatio <= 0.15) {
            score += 3;
          } else if (priceDifferenceRatio <= 0.3) {
            score += 2;
          } else if (priceDifferenceRatio <= 0.5) {
            score += 1;
          }
        }

        return { property, score };
      })
      .sort((first, second) => {
        if (second.score !== first.score) {
          return second.score - first.score;
        }

        return (second.property.created_at ?? '').localeCompare(
          first.property.created_at ?? '',
        );
      })
      .map(({ property }) => property)
      .slice(0, 15);
  }, [properties, selectedProperty]);

  return (
    <div className="min-h-screen bg-[#f6f7f8] font-sans text-slate-900 selection:bg-primary/30">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-start">
            <BrandLogo onClick={handleGoHome} className="shrink-0" />
          </div>

          <div className="hidden items-center justify-center md:flex">
            <div className="flex items-center gap-3">
              {HOME_MENU_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleMenuNavigation(item.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-slate-600 hover:text-primary'
                  }`}
                >
                  <item.icon className="size-4" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3">
            <a
              href="https://wa.me/5511916751213"
              target="_blank"
              rel="noreferrer"
              aria-label="Conversar no WhatsApp"
              className="hidden size-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/25 transition hover:bg-[#1ebe5a] md:inline-flex"
            >
              <MessageCircle className="size-4.5" />
            </a>
            <div className="hidden min-h-11 items-center justify-end md:flex">
              {isLoadingUser ? (
                <div className="flex items-center justify-end gap-2">
                  <div className="h-11 w-[132px] animate-pulse rounded-lg bg-slate-100" />
                </div>
              ) : !user ? (
                <div className="flex justify-end">
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
                        aria-label="Abrir area da conta"
                        className="flex size-11 items-center justify-center transition hover:scale-[1.02]"
                      >
                        <UserAvatar email={user.email} />
                      </Link>
                    ) : (
                      <div className="flex size-11 items-center justify-center">
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
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${
                    activeSection === item.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/80 shadow-sm">
                    <item.icon className="size-4" />
                  </span>
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
              {isLoadingUser ? (
                <div className="h-12 animate-pulse rounded-2xl bg-slate-100" />
              ) : user ? (
                <>
                  {adminHref ? (
                    <Link
                      href={adminHref}
                      onClick={() => setIsMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white shadow-sm">
                        <UserCog className="size-4" />
                      </span>
                      Ambiente administrativo
                    </Link>
                  ) : null}
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white shadow-sm">
                        <ArrowLeft className="size-4" />
                      </span>
                      Sair
                    </button>
                  </form>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-3 rounded-2xl bg-slate-950 px-4 py-3 text-left font-semibold text-white"
                >
                  <span className="inline-flex size-9 items-center justify-center rounded-xl bg-white/10">
                    <UserRound className="size-4" />
                  </span>
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
                  similarProperties={similarProperties}
                  user={user}
                  onBack={handleBackToListings}
                  onPropertyClick={handlePropertyClick}
                  onUnlockInformation={() => setActiveChatPropertyId(selectedProperty.id)}
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
      {isChatEnabled ? <InfraChatWidget propertyId={activeChatPropertyId} /> : null}
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
  onPropertyClick,
  properties,
}: {
  featuredProperties: Property[];
  isAdmin?: boolean;
  isLoading: boolean;
  onBrowse: () => void;
  onPropertyClick: (p: Property) => void;
  properties: Property[];
}) {
  const [visibleCount, setVisibleCount] = useState(3);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const visibleProperties = properties.slice(0, visibleCount);
  const hasMoreProperties = visibleCount < properties.length;
  const featuredProperty = featuredProperties[featuredIndex] ?? null;
  const goToPreviousFeatured = () => {
    if (featuredProperties.length <= 1) {
      return;
    }

    setFeaturedIndex((currentIndex) =>
      currentIndex === 0 ? featuredProperties.length - 1 : currentIndex - 1,
    );
  };
  const goToNextFeatured = () => {
    if (featuredProperties.length <= 1) {
      return;
    }

    setFeaturedIndex((currentIndex) => (currentIndex + 1) % featuredProperties.length);
  };
  const { swipeHandlers: featuredSwipeHandlers } = useSwipeNavigation({
    onSwipeLeft: goToNextFeatured,
    onSwipeRight: goToPreviousFeatured,
  });

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
      <section
        id="topo"
        className="flex scroll-mt-24 flex-col items-center gap-12 py-6 lg:flex-row"
      >
        <div className="flex-1 space-y-3">
          <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            Assessoria especializada em leilões imobiliários
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Compre imóveis de leilão com{' '}
            <span className="text-primary">segurança e estratégia comprovada</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Da análise do edital à posse cuidamos de todo o processo para você
            investir com segurança e aumentar suas chances de lucro.
          </p>

        </div>

        <div className="w-full flex-1">
          <div
            {...featuredSwipeHandlers}
            className="relative h-[300px] w-full overflow-hidden rounded-2xl shadow-2xl sm:h-[450px]"
            style={{ touchAction: 'pan-y' }}
          >
            <Image
              src={featuredProperty?.image_url ?? HERO_FALLBACK_IMAGE}
              fill
              className="object-cover"
              alt={featuredProperty?.title ?? 'Hero'}
              priority
              referrerPolicy="no-referrer"
              unoptimized
            />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-5 sm:left-5 sm:right-5">
              <div className="ml-auto max-w-md rounded-[1.15rem] border border-white/25 bg-white/88 p-3 shadow-lg backdrop-blur-md sm:p-3.5">
                {featuredProperty ? (
                  <>
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                          Em destaque
                        </p>
                        <p className="truncate text-sm font-bold text-slate-900">
                          {featuredProperty.title}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {featuredProperty.location || 'Localização não informada'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-slate-500">Lance mínimo</p>
                        <p className="text-sm font-bold text-slate-900">
                          {formatCurrency(featuredProperty.price)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        {featuredProperties.map((property, index) => (
                          <button
                            key={property.id}
                            type="button"
                            aria-label={`Exibir destaque ${index + 1}`}
                            onClick={() => setFeaturedIndex(index)}
                            className={`h-2.5 rounded-full transition-all ${
                              index === featuredIndex
                                ? 'w-7 bg-primary'
                                : 'w-2 bg-slate-300 hover:bg-slate-400'
                            }`}
                          />
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => onPropertyClick(featuredProperty)}
                        className="rounded-full bg-slate-900 px-3.5 py-2 text-[11px] font-bold text-white transition hover:bg-slate-800"
                      >
                        Ver imóvel
                      </button>
                      {isAdmin ? (
                        <AdminEditPropertyLink propertyId={featuredProperty.id} compact />
                      ) : null}
                    </div>
                  </>
                ) : (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                      Nenhum imóvel encontrado
                    </p>
                    <p className="text-sm text-slate-600">
                      Cadastre imóveis no admin para alimentar esta vitrine.
                    </p>
                  </div>
                )}
              </div>
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
            Inteligência, segurança e acompanhamento em todas as etapas
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: <BriefcaseBusiness className="size-6 text-primary" />,
              title: 'Assessoria completa do lance à chave na mão',
              text: 'Acompanhamos todo o processo, desde a análise do edital até a entrega do imóvel.',
            },
            {
              icon: <ShieldCheck className="size-6 text-primary" />,
              title: 'Segurança total em cada etapa do leilão',
              text: 'Nossa equipe analisa os riscos jurídicos e financeiros antes de qualquer recomendação.',
            },
            {
              icon: <Scale className="size-6 text-primary" />,
              title: 'Análise jurídica completa',
              text: 'Verificamos processos, matrícula, dívidas e possíveis riscos antes do arremate.',
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

      <section className="scroll-mt-24" id="institucional">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2.25rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-8 text-white shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
              Missão e visão
            </p>
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-2xl font-bold">Missão</h3>
                <p className="mt-3 text-sm leading-8 text-slate-300">
                  Oferecer assessoria completa e transparente em leilões de
                  imóveis, conectando pessoas, famílias e investidores a
                  oportunidades reais para conquistar a casa própria ou ampliar o
                  patrimônio com segurança e economia.
                </p>
              </div>
              <div className="h-px bg-white/10" />
              <div>
                <h3 className="text-2xl font-bold">Visão</h3>
                <p className="mt-3 text-sm leading-8 text-slate-300">
                  Ser reconhecida como a principal referência em assessoria de
                  leilões no Brasil, tornando esse mercado mais acessível, seguro
                  e confiável para todos.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
              Valores
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
              Princípios que sustentam cada recomendação
            </h3>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              Nossa atuação combina critério técnico com proximidade humana para
              oferecer uma experiência premium, segura e objetiva do primeiro
              contato até a arrematação.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {BRAND_VALUES.map((value) => (
                <span
                  key={value}
                  className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  {value}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="scroll-mt-24" id="planos">
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            Oportunidades de imóveis
          </p>
          <h3 className="text-3xl font-bold text-slate-900">
            Oportunidades exclusivas de imóveis em leilão
          </h3>
          <p className="text-base leading-8 text-slate-600">
            Explore imóveis selecionados com análise prévia da equipe Nexo.
            Encontre oportunidades com valores abaixo do mercado e potencial real de valorização.
          </p>
        </div>

        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900">
            Imóveis selecionados
          </h3>
          <button
            onClick={onBrowse}
            className="inline-flex items-center rounded-full border border-primary/20 bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
          >
            Ver todos
          </button>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Carregando imóveis...
          </div>
        ) : properties.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Nenhum imóvel disponível no momento.
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
                  Carregar mais 6 imóveis
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
              title: 'Análise e Estratégia',
              text: 'Entendemos seu objetivo: investir, revender ou adquirir um imóvel para moradia.',
            },
            {
              icon: <FileSearch className="size-5 text-primary" />,
              title: 'Seleção e Due Diligence',
              text: 'Filtramos imóveis e realizamos uma análise jurídica e financeira detalhada.',
            },
            {
              icon: <Landmark className="size-5 text-primary" />,
              title: 'Lances e Arremate',
              text: 'Acompanhamos você durante o processo do leilão e orientamos na estratégia de lances.',
            },
            {
              icon: <Home className="size-5 text-primary" />,
              title: 'Regularização e Posse',
              text: 'Auxiliamos nos trâmites após o arremate até a regularização e posse do imóvel.',
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
        id="sobre"
        className="scroll-mt-24 overflow-hidden rounded-[2.5rem] border border-slate-200 bg-white shadow-sm"
      >
        <div className="grid gap-0 lg:grid-cols-[1.08fr_0.92fr]">
          <div className="relative p-8 sm:p-10">
                        <>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/18 via-secondary/10 via-45% to-white/0 sm:h-80" />
              <div className="pointer-events-none absolute left-[-8%] top-[-10%] h-48 w-48 rounded-full bg-primary/10 blur-3xl sm:h-60 sm:w-60" />
            </>
            <div className="relative space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
                  Sobre a Nexo
                </p>
                <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-slate-900 sm:text-[2.2rem]">
                  Tornamos o leilão imobiliário mais acessível, seguro e confiável
                </h2>
              </div>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                Na Nexo Leilões, democratizamos o acesso aos leilões de imóveis,
                transformando uma oportunidade antes exclusiva em um caminho seguro,
                transparente e acessível para todos.
              </p>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                Atuamos como uma ponte entre você e as melhores oportunidades do
                mercado, oferecendo suporte jurídico, financeiro e estratégico em
                cada etapa do processo.
              </p>
              <p className="max-w-2xl text-base leading-8 text-slate-600">
                Nossa missão é garantir que famílias e investidores avancem com
                confiança para conquistar imóveis de alto valor por preços justos,
                sem surpresas e com total segurança.
              </p>
              <div className="grid gap-4 sm:grid-cols-3">
                {ABOUT_PILLARS.map((item) => (
                  <div
                    key={item}
                    className="rounded-[1.6rem] border border-slate-200 bg-slate-50/90 p-5"
                  >
                    <CheckCircle2 className="mb-3 size-5 text-primary" />
                    <p className="text-sm leading-7 text-slate-600">{item}</p>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  window.open('https://wa.me/5511916751213', '_blank', 'noopener,noreferrer')
                }
                className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Falar com a equipe
              </button>
            </div>
          </div>
          <div className="border-t border-slate-200 bg-slate-950 p-8 text-white sm:p-10 lg:border-l lg:border-t-0">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
                  Fundador
                </p>
                <h3 className="mt-3 text-3xl font-bold tracking-tight">
                  Servolo Tobias
                </h3>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  Há mais de 20 anos, Servolo cria soluções que entregam economia
                  e segurança para pessoas e empresas, sempre orientado por gerar
                  valor real.
                </p>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  Sua relação com leilões nasceu da curiosidade em estudar editais,
                  calcular riscos e ajudar amigos a arrematar bons negócios. Dessa
                  paixão surgiu um método próprio, baseado em leitura profunda do
                  imóvel, custos, cenários e estratégia.
                </p>
                <p className="mt-4 text-base leading-8 text-slate-300">
                  Na Nexo, esse olhar se transforma em assessoria próxima,
                  transparente e criteriosa, seja para quem busca o primeiro lar,
                  seja para quem quer acelerar o próximo investimento.
                </p>
              </div>
              <div className="rounded-[1.8rem] border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-primary">
                  De paixão a método
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-200">
                  Mais do que assessorar, Servolo construiu uma reputação de
                  confiança e compromisso absoluto com o resultado de cada cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-slate-200 bg-white p-8 sm:p-10">
          <div className="mb-8 max-w-3xl space-y-3">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
              Nossa trajetória
            </p>
            <h3 className="text-3xl font-bold tracking-tight text-slate-900">
              História, critério e compromisso com seu resultado
            </h3>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {HISTORY_HIGHLIGHTS.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.8rem] border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {item.eyebrow}
                </p>
                <h4 className="mt-3 text-xl font-bold text-slate-900">{item.title}</h4>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
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
              Por que escolher a Nexo Leilões?
            </h2>
            <div className="relative hidden overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:block">
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent" />
              <Image
                src="/images/analise-imovel.png"
                alt="Análise estratégica de imóvel da Nexo"
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
                  Oportunidades analisadas com foco em liquidez, segurança jurídica
                  e potencial real de valorização.
                </p>
              </div>
            </div>
          </div>
          <div className="grid gap-4">
            {[
              'Análise jurídica combinada com estratégia de investimento',
              'Identificação de oportunidades reais com potencial de valorização',
              'Atendimento consultivo e acompanhamento especializado',
              'Avaliação inicial do perfil do investidor',
              'Curadoria de ativos com maior liquidez e leitura de saída',
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

      <section
        id="faq"
        className="scroll-mt-24 rounded-[2.5rem] border border-slate-200 bg-white p-8 shadow-sm sm:p-10"
      >
        <div className="mb-8 max-w-3xl space-y-3">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-primary">
            FAQ
          </p>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Perguntas frequentes para decidir com mais segurança
          </h2>
          <p className="text-base leading-8 text-slate-600">
            Reunimos as dúvidas mais comuns sobre leilões de imóveis, relatórios e
            assessoria para você avançar com clareza desde o primeiro passo.
          </p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {FAQ_ITEMS.map((item, index) => (
            <details
              key={item.question}
              className="group rounded-[1.5rem] border border-slate-200 bg-slate-50/80 p-5 transition hover:border-primary/25 hover:bg-white"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    {String(index + 1).padStart(2, '0')}
                  </p>
                  <h3 className="mt-2 text-base font-bold text-slate-900">
                    {item.question}
                  </h3>
                </div>
                <span className="mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition group-open:rotate-180 group-open:text-primary">
                  <ChevronDown className="size-4" />
                </span>
              </summary>
              <p className="mt-4 border-t border-slate-200 pt-4 text-sm leading-7 text-slate-600">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

    </div>
  );
}

function InfraChatWidget({ propertyId }: { propertyId: string | null }) {
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!propertyId) {
      cleanupInfraChatWidget();
      return;
    }

    let isCancelled = false;

    loadInfraChatScript()
      .then(() => {
        if (isCancelled) {
          return;
        }
      })
      .catch((error) => {
        console.error('Failed to mount InfraChat widget', error);
      });

    return () => {
      isCancelled = true;
      cleanupInfraChatWidget();
    };
  }, [propertyId]);

  if (!propertyId) {
    return null;
  }

  return null;
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
  const suppressCardClickRef = useRef(false);
  const cardDescriptionPreview = createPropertyCardPreview(property.description);

  const showPreviousImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setImageIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  };

  const showNextImage = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setImageIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
  };

  const showPreviousImageFromGesture = () => {
    suppressCardClickRef.current = true;
    setImageIndex((current) => (current === 0 ? gallery.length - 1 : current - 1));
  };

  const showNextImageFromGesture = () => {
    suppressCardClickRef.current = true;
    setImageIndex((current) => (current === gallery.length - 1 ? 0 : current + 1));
  };

  const { swipeHandlers: cardSwipeHandlers } = useSwipeNavigation({
    onSwipeLeft: showNextImageFromGesture,
    onSwipeRight: showPreviousImageFromGesture,
  });

  return (
    <div
      onClick={() => {
        if (suppressCardClickRef.current) {
          suppressCardClickRef.current = false;
          return;
        }

        onClick();
      }}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl"
    >
      <div
        {...cardSwipeHandlers}
        className="relative aspect-[4/3] w-full overflow-hidden"
        style={{ touchAction: 'pan-y' }}
      >
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
        <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">
          {cardDescriptionPreview}
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
          Carregando imóveis...
        </div>
      ) : filteredProperties.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
          Nenhum imóvel encontrado para essa busca.
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
  similarProperties,
  user,
  onBack,
  onPropertyClick,
  onUnlockInformation,
}: {
  property: Property;
  similarProperties: Property[];
  user: UserType | null;
  onBack: () => void;
  onPropertyClick: (property: Property) => void;
  onUnlockInformation: () => void;
}) {
  const [activeImage, setActiveImage] = useState(property.image_url);
  const isAdmin = user?.tipo_usuario === 'admin';
  const [hasUnlockedPremium, setHasUnlockedPremium] = useState(false);
  const [activePremiumTab, setActivePremiumTab] = useState<'geral' | 'dossie' | 'analise' | 'arquivos'>('geral');
  const [similarPage, setSimilarPage] = useState(0);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);

  useEffect(() => {
    setActiveImage(property.image_url);
    setHasUnlockedPremium(false);
    setActivePremiumTab('geral');
    setSimilarPage(0);
    setShareFeedback(null);
  }, [property.id, property.image_url]);

  const gallery = property.images?.length ? property.images : [property.image_url];
  const SIMILAR_PROPERTIES_PER_PAGE = 3;
  const similarPropertyPages = useMemo(() => {
    const pages: Property[][] = [];

    for (let index = 0; index < similarProperties.length; index += SIMILAR_PROPERTIES_PER_PAGE) {
      pages.push(similarProperties.slice(index, index + SIMILAR_PROPERTIES_PER_PAGE));
    }

    return pages;
  }, [similarProperties]);
  const visibleSimilarProperties = similarPropertyPages[similarPage] ?? [];
  const goToPreviousDetailImage = () => {
    const currentIndex = gallery.findIndex((imageUrl) => imageUrl === activeImage);
    const previousIndex = currentIndex <= 0 ? gallery.length - 1 : currentIndex - 1;
    setActiveImage(gallery[previousIndex] ?? property.image_url);
  };
  const goToNextDetailImage = () => {
    const currentIndex = gallery.findIndex((imageUrl) => imageUrl === activeImage);
    const nextIndex = currentIndex === -1 || currentIndex === gallery.length - 1 ? 0 : currentIndex + 1;
    setActiveImage(gallery[nextIndex] ?? property.image_url);
  };
  const goToPreviousSimilarPage = () => {
    setSimilarPage((currentPage) =>
      currentPage === 0 ? similarPropertyPages.length - 1 : currentPage - 1,
    );
  };
  const goToNextSimilarPage = () => {
    setSimilarPage((currentPage) => (currentPage + 1) % similarPropertyPages.length);
  };
  const { swipeHandlers: detailImageSwipeHandlers } = useSwipeNavigation({
    onSwipeLeft: goToNextDetailImage,
    onSwipeRight: goToPreviousDetailImage,
  });
  const { swipeHandlers: similarSectionSwipeHandlers } = useSwipeNavigation({
    onSwipeLeft: goToNextSimilarPage,
    onSwipeRight: goToPreviousSimilarPage,
  });
  const premiumTabs: Array<{
    key: 'geral' | 'dossie' | 'analise' | 'arquivos';
    label: string;
    icon: React.ReactNode;
  }> = [
    { key: 'geral', label: 'Informacoes basicas', icon: <Home className="size-4" /> },
    { key: 'dossie', label: 'Visao geral', icon: <BookText className="size-4" /> },
    { key: 'analise', label: 'Dossie', icon: <ClipboardList className="size-4" /> },
    { key: 'arquivos', label: 'Arquivos', icon: <File className="size-4" /> },
  ];

  const handleUnlockInformation = () => {
    setHasUnlockedPremium(true);
    setActivePremiumTab('dossie');
    onUnlockInformation();
  };

  const handleShareProperty = async () => {
    const shareUrl =
      typeof window === 'undefined'
        ? `/imoveis/${property.id}`
        : new URL(`/imoveis/${property.id}`, window.location.origin).toString();
    const shareData = {
      title: `${property.title} | Nexo Leiloes`,
      text: `Confira este imovel em leilao${property.location ? ` em ${property.location}` : ''}.`,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareFeedback('Link compartilhado.');
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setShareFeedback('Link copiado.');
        return;
      }

      setShareFeedback('Nao foi possivel compartilhar neste navegador.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      console.error('Falha ao compartilhar imovel', error);
      setShareFeedback('Nao foi possivel compartilhar agora.');
    }
  };

  useEffect(() => {
    if (similarPropertyPages.length <= 1) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setSimilarPage((currentPage) => (currentPage + 1) % similarPropertyPages.length);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [similarPropertyPages.length]);

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
            <div
              {...detailImageSwipeHandlers}
              className="relative aspect-video overflow-hidden rounded-2xl shadow-xl"
              style={{ touchAction: 'pan-y' }}
            >
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
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <ClipboardList className="size-5 text-primary" />
              Resumo do Imovel
            </h3>
            <div className="space-y-4">
              <SummaryRow
                icon={<CircleDollarSign className="size-4 text-primary" />}
                label="Valor do leilao"
                value={formatCurrency(property.price)}
                valueClassName="text-primary"
              />
              <SummaryRow
                icon={<Wallet className="size-4 text-primary" />}
                label="Valor de avaliacao"
                value={property.valuation_price == null ? '-' : formatCurrency(property.valuation_price)}
              />
              <SummaryRow
                icon={<Building2 className="size-4 text-primary" />}
                label="Tipo de propriedade"
                value={property.type}
              />
              <SummaryRow
                icon={<Gavel className="size-4 text-primary" />}
                label="Tipo de leilao"
                value={property.auction_type || '-'}
              />
              <SummaryRow
                icon={<CheckCircle2 className="size-4 text-primary" />}
                label="Status"
                value={property.status || '-'}
              />
              <SummaryRow
                icon={<Calendar className="size-4 text-primary" />}
                label="Data do leilao"
                value={formatDate(property.auction_date)}
              />
              <SummaryRow
                icon={<Square className="size-4 text-primary" />}
                label="Area construida"
                value={formatArea(property.built_area)}
              />
              <SummaryRow
                icon={<MapPin className="size-4 text-primary" />}
                label="CEP"
                value={property.cep || '-'}
              />
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
                <button
                  type="button"
                  onClick={handleShareProperty}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50"
                >
                  <Share2 className="size-4" /> Compartilhar
                </button>
                <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50">
                  <Heart className="size-4" /> Salvar
                </button>
              </div>
              {shareFeedback ? (
                <p aria-live="polite" className="text-xs text-slate-500">
                  {shareFeedback}
                </p>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {hasUnlockedPremium ? (
            <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-4">
              {premiumTabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() =>
                    setActivePremiumTab(
                      tab.key as 'geral' | 'dossie' | 'analise' | 'arquivos',
                    )
                  }
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center text-sm font-bold leading-tight transition ${
                    activePremiumTab === tab.key
                      ? 'border-primary text-primary shadow-sm'
                      : 'border-slate-200 bg-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          ) : null}

          {(!hasUnlockedPremium || activePremiumTab === 'geral') ? (
            <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
                <div>
                  <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
                    <Home className="size-7 text-primary" />
                    <span>{property.title}</span>
                  </h1>
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
                <h3 className="flex items-center gap-2 text-xl font-bold">
                  <BookText className="size-5 text-primary" />
                  Descricao
                </h3>
                <PropertyDescription value={property.description} />
              </div>
            </div>
          ) : null}

          {hasUnlockedPremium && activePremiumTab === 'dossie' ? (
            <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm md:grid-cols-2">
              <DetailPanelCard
                icon={<BookText className="size-4 text-primary" />}
                label="Resumo executivo"
                value={property.dossier?.resumo_executivo}
              />
              <DetailPanelCard
                icon={<Home className="size-4 text-primary" />}
                label="Ocupacao"
                value={property.dossier?.ocupacao}
              />
              <DetailPanelCard
                icon={<FileBadge2 className="size-4 text-primary" />}
                label="Matricula"
                value={property.dossier?.matricula}
              />
              <DetailPanelCard
                icon={<Landmark className="size-4 text-primary" />}
                label="Cartorio"
                value={property.dossier?.cartorio}
              />
              <DetailPanelCard
                icon={<Scale className="size-4 text-primary" />}
                label="Numero do processo"
                value={property.dossier?.numero_processo}
              />
              <DetailPanelCard
                icon={<CircleDollarSign className="size-4 text-primary" />}
                label="Valor de mercado"
                value={formatOptionalCurrency(property.dossier?.valor_mercado)}
              />
              <DetailPanelCard
                icon={<Target className="size-4 text-primary" />}
                label="Lance recomendado"
                value={formatOptionalCurrency(property.dossier?.lance_recomendado)}
              />
              <DetailPanelCard
                icon={<PiggyBank className="size-4 text-primary" />}
                label="Lucro estimado"
                value={formatOptionalCurrency(property.dossier?.lucro_estimado)}
              />
              <DetailPanelCard
                icon={<TrendingUp className="size-4 text-primary" />}
                label="ROI estimado"
                value={formatPercent(property.dossier?.roi_estimado)}
              />
              <DetailPanelCard
                icon={<Receipt className="size-4 text-primary" />}
                label="Divida de IPTU"
                value={formatOptionalCurrency(property.dossier?.divida_iptu)}
              />
              <DetailPanelCard
                icon={<BriefcaseBusiness className="size-4 text-primary" />}
                label="Divida de condominio"
                value={formatOptionalCurrency(property.dossier?.divida_condominio)}
              />
            </div>
          ) : null}

          {hasUnlockedPremium && activePremiumTab === 'analise' ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <LongDetailBlock
                icon={<Target className="size-4 text-primary" />}
                label="Analise do investimento"
                value={property.dossier?.analise}
              />
              <LongDetailBlock
                icon={<ShieldCheck className="size-4 text-primary" />}
                label="Riscos"
                value={property.dossier?.riscos}
              />
              <LongDetailBlock
                icon={<Scale className="size-4 text-primary" />}
                label="Observacoes juridicas"
                value={property.dossier?.observacoes_juridicas}
              />
              <LongDetailBlock
                icon={<Gavel className="size-4 text-primary" />}
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
                      <p className="flex items-center gap-2 font-semibold text-slate-900">
                        <File className="size-4 text-primary" />
                        {file.nome_arquivo || 'Arquivo sem nome'}
                      </p>
                      <p className="mt-1 flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] leading-none text-slate-400">
                        <FileSearch className="size-3.5" />
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
            <h3 className="flex items-center gap-2 text-xl font-bold">
              <Map className="size-5 text-primary" />
              Localizacao
            </h3>
            <p className="flex items-start gap-2 text-sm leading-5 text-slate-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              {property.address || 'Endereco nao informado'}
            </p>
            <p className="flex items-start gap-2 text-sm leading-5 text-slate-500">
              <Landmark className="mt-0.5 size-4 shrink-0 text-primary" />
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

      {similarProperties.length ? (
        <section className="mt-12 pt-10 sm:mt-16 sm:pt-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-px flex-1 bg-slate-200" />
              <div className="rounded-full border border-primary/15 bg-primary/5 px-4 py-1 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
                Continuar explorando
              </div>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                Descubra mais
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Imoveis parecidos com este
              </h2>
            </div>

            <div
              {...similarSectionSwipeHandlers}
              className="grid gap-6 md:grid-cols-2 xl:grid-cols-3"
              style={{ touchAction: 'pan-y' }}
            >
              {visibleSimilarProperties.map((similarProperty) => (
                <PropertyCard
                  key={similarProperty.id}
                  isAdmin={isAdmin}
                  property={similarProperty}
                  onClick={() => onPropertyClick(similarProperty)}
                />
              ))}
            </div>

            {similarPropertyPages.length > 1 ? (
              <div className="flex items-center justify-center gap-2">
                {similarPropertyPages.map((_, index) => (
                  <button
                    key={`similar-page-${index}`}
                    type="button"
                    onClick={() => setSimilarPage(index)}
                    aria-label={`Ver grupo ${index + 1} de imoveis parecidos`}
                    className={`h-2.5 rounded-full transition-all ${
                      index === similarPage
                        ? 'w-8 bg-primary'
                        : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                    }`}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
      </motion.div>
    </>
  );
}

function DetailPanelCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] leading-none text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-slate-700">{value || '-'}</p>
    </div>
  );
}
function createPropertyCardPreview(value: string | null | undefined) {
  if (!value) {
    return 'Descrição não informada.';
  }

  const plainText = value
    .replace(/\r\n/g, '\n')
    .replace(/#{1,6}\s*/g, ' ')
    .replace(/\*\*/g, '')
    .replace(/[-*â€¢]+\s*/g, ' ')
    .replace(/[|_[\]{}<>~`]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!plainText) {
    return 'Descrição não informada.';
  }

  const normalized = plainText.toLocaleLowerCase('pt-BR');
  return normalized.charAt(0).toLocaleUpperCase('pt-BR') + normalized.slice(1);
}

function LongDetailBlock({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] leading-none text-slate-400">
        {icon}
        {label}
      </p>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
        {value || 'Nenhuma informacao cadastrada ate o momento.'}
      </p>
    </div>
  );
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
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-slate-500">
        {icon}
        {label}
      </span>
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









