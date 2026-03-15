'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bath,
  Bed,
  Calendar,
  Filter,
  Heart,
  Home,
  MapPin,
  Menu,
  MessageCircle,
  Search,
  Send,
  Share2,
  Square,
  X,
} from 'lucide-react';
import { ChatMessage, Property, User as UserType } from '@/lib/types';

const HERO_FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000';

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoadingProperties, setIsLoadingProperties] = useState(true);

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

  const handleBackToListings = () => {
    setView('listings');
    setSelectedProperty(null);
    router.push('/imoveis');
  };

  const featuredProperty = properties[0] ?? null;

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

          <div className="hidden items-center gap-8 md:flex">
            <button
              onClick={handleBrowse}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Oportunidades
            </button>
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <a
                href="/login"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-sm transition-all hover:bg-primary/90"
              >
                Login
              </a>
            ) : (
              <div className="flex items-center gap-3">
                <span className="hidden text-sm font-medium sm:block">{user.email}</span>
                <div className="relative size-8 overflow-hidden rounded-full bg-slate-200">
                  <Image
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                    alt="Avatar"
                    fill
                    className="object-cover"
                    referrerPolicy="no-referrer"
                    unoptimized
                  />
                </div>
              </div>
            )}

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
              <button
                onClick={() => {
                  setView('listings');
                  router.push('/imoveis');
                  setIsMenuOpen(false);
                }}
                className="text-left font-medium"
              >
                Oportunidades
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {view === 'home' && (
          <HomeView
            featuredProperty={featuredProperty}
            isLoading={isLoadingProperties}
            onBrowse={handleBrowse}
            onPropertyClick={handlePropertyClick}
            properties={properties}
          />
        )}
        {view === 'listings' && (
          <ListingsView
            isLoading={isLoadingProperties}
            properties={properties}
            onPropertyClick={handlePropertyClick}
          />
        )}
        {view === 'details' && selectedProperty && (
          <PropertyDetailsView
            property={selectedProperty}
            onBack={handleBackToListings}
          />
        )}
        {view === 'details' && !selectedProperty && !isLoadingProperties ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Imovel nao encontrado.
          </div>
        ) : null}
      </main>

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

function HomeView({
  featuredProperty,
  isLoading,
  onBrowse,
  onPropertyClick,
  properties,
}: {
  featuredProperty: Property | null;
  isLoading: boolean;
  onBrowse: () => void;
  onPropertyClick: (p: Property) => void;
  properties: Property[];
}) {
  const [visibleCount, setVisibleCount] = useState(3);
  const visibleProperties = properties.slice(0, visibleCount);
  const hasMoreProperties = visibleCount < properties.length;

  return (
    <div className="space-y-12">
      <section className="flex flex-col items-center gap-12 py-12 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            Oportunidades reais atualizadas do banco
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Encontre sua proxima oportunidade de{' '}
            <span className="text-primary">investimento</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Explore os imoveis cadastrados na plataforma com dados reais de valor,
            localizacao, leilao e detalhes completos.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button
              onClick={onBrowse}
              className="rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Ver imoveis
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50">
              Saiba mais
            </button>
          </div>
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

      <section>
        <div className="mb-8 flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900">
            Oportunidades em destaque
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
    </div>
  );
}

function PropertyCard({
  property,
  onClick,
}: {
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
  isLoading,
  properties,
  onPropertyClick,
}: {
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
  onBack,
}: {
  property: Property;
  onBack: () => void;
}) {
  const [activeImage, setActiveImage] = useState(property.image_url);
  const [hasUnlockedPremium, setHasUnlockedPremium] = useState(false);
  const [activePremiumTab, setActivePremiumTab] = useState<'geral' | 'dossie' | 'arquivos'>('geral');
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
  const [isDesktopChatVisible, setIsDesktopChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');

  useEffect(() => {
    setActiveImage(property.image_url);
    setHasUnlockedPremium(false);
    setActivePremiumTab('geral');
    setIsMobileChatOpen(false);
    setIsDesktopChatVisible(false);
    setChatMessages([
      {
        role: 'model',
        text: `Oi! Posso te ajudar com informacoes sobre ${property.title}. Pergunte sobre valor, leilao, localizacao ou caracteristicas do imovel.`,
      },
    ]);
    setChatInput('');
  }, [property.id, property.image_url]);

  const gallery = property.images?.length ? property.images : [property.image_url];

  const handleUnlockInformation = () => {
    setHasUnlockedPremium(true);
    setActivePremiumTab('dossie');
    setIsMobileChatOpen(true);
    setIsDesktopChatVisible(true);
  };

  const submitChatMessage = () => {
    const trimmedInput = chatInput.trim();

    if (!trimmedInput) {
      return;
    }

    setChatMessages((current) => [
      ...current,
      { role: 'user', text: trimmedInput },
      {
        role: 'model',
        text: `Recebi sua pergunta sobre ${property.title}. Agora este painel pode continuar aberto enquanto voce analisa o dossie e os arquivos complementares do imovel.`,
      },
    ]);
    setChatInput('');
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
        <div className="space-y-8 lg:col-span-2">
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

            {hasUnlockedPremium ? (
              <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'geral', label: 'Visao geral' },
                    { key: 'dossie', label: 'Dossie' },
                    { key: 'arquivos', label: 'Arquivos' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() =>
                        setActivePremiumTab(tab.key as 'geral' | 'dossie' | 'arquivos')
                      }
                      className={`rounded-full px-4 py-2 text-sm font-bold transition ${
                        activePremiumTab === tab.key
                          ? 'bg-primary text-white shadow-lg shadow-primary/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {activePremiumTab === 'geral' ? (
                  <div className="grid gap-4 md:grid-cols-2">
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

                {activePremiumTab === 'dossie' ? (
                  <div className="space-y-4">
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

                {activePremiumTab === 'arquivos' ? (
                  <div className="space-y-3">
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
            ) : null}
          </div>

          <div className="space-y-8">
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
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
            <button
              type="button"
              onClick={handleUnlockInformation}
              className="w-full rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90"
            >
              Solicitar Informacoes
            </button>
            <div className="flex gap-2">
              <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50">
                <Share2 className="size-4" /> Compartilhar
              </button>
              <button className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-200 py-3 text-sm font-medium hover:bg-slate-50">
                <Heart className="size-4" /> Salvar
              </button>
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Localizacao</h3>
            <p className="text-sm leading-relaxed text-slate-600">
              {property.address || 'Endereco nao informado'}
            </p>
            <p className="text-sm leading-relaxed text-slate-500">
              {property.location || 'Cidade e estado nao informados'}
            </p>
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
  onSubmit: () => void;
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
                <ChatMessages messages={messages} />
                <ChatComposer
                  input={input}
                  onChange={onInputChange}
                  onSubmit={onSubmit}
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
                <ChatMessages messages={messages} />
                <ChatComposer
                  input={input}
                  onChange={onInputChange}
                  onSubmit={onSubmit}
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

function ChatMessages({ messages }: { messages: ChatMessage[] }) {
  return (
    <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50/70 px-6 py-5">
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
}: {
  input: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="border-t border-slate-200 bg-white px-6 py-5">
      <div className="flex items-end gap-3">
        <textarea
          value={input}
          onChange={(event) => onChange(event.target.value)}
          rows={2}
          placeholder="Escreva sua mensagem sobre este imovel"
          className="min-h-[56px] flex-1 resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex size-12 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/20 transition hover:bg-primary/90"
        >
          <Send className="size-4" />
        </button>
      </div>
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
