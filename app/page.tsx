'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Bath,
  Bed,
  Heart,
  Home,
  Lock,
  MapPin,
  Menu,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Square,
  Calendar,
  User,
  X,
} from 'lucide-react';
import { Property, User as UserType } from '@/lib/types';

const MOCK_PROPERTIES: Property[] = [
  {
    id: 1,
    title: 'Skyline Plaza Luxury Apartment',
    description:
      'Apartamento de alto padrao com vista panoramica para o centro da cidade. Totalmente mobiliado e com acabamentos de luxo.',
    price: 1250000,
    location: 'Centro, Sao Paulo',
    image_url:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000',
    beds: 3,
    baths: 2,
    sqft: 1850,
    type: 'Apartamento',
    roi: 12.4,
    cap_rate: 8.5,
    is_premium: 1,
  },
  {
    id: 2,
    title: 'Vila Oakwood Residence',
    description:
      'Casa contemporanea em condominio fechado com seguranca 24h e area de lazer completa. Ideal para familias.',
    price: 850000,
    location: 'Jardins, Sao Paulo',
    image_url:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000',
    beds: 4,
    baths: 3,
    sqft: 2400,
    type: 'Casa',
    roi: 10.2,
    cap_rate: 7.8,
    is_premium: 0,
  },
  {
    id: 3,
    title: 'Modern Loft Downtown',
    description:
      'Loft industrial moderno com pe direito duplo e design arrojado. Localizacao privilegiada proxima a centros comerciais.',
    price: 620000,
    location: 'Vila Madalena, Sao Paulo',
    image_url:
      'https://images.unsplash.com/photo-1536376074432-a228d0a59cf4?auto=format&fit=crop&q=80&w=1000',
    beds: 1,
    baths: 1,
    sqft: 950,
    type: 'Loft',
    roi: 14.8,
    cap_rate: 9.2,
    is_premium: 1,
  },
  {
    id: 4,
    title: 'Green Valley Estate',
    description:
      'Propriedade rural de luxo com haras e area verde preservada. Perfeita para quem busca tranquilidade e contato com a natureza.',
    price: 3450000,
    location: 'Interior, Sao Paulo',
    image_url:
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000',
    beds: 6,
    baths: 5,
    sqft: 12000,
    type: 'Fazenda',
    roi: 8.5,
    cap_rate: 6.5,
    is_premium: 1,
  },
];

export default function App() {
  const [view, setView] = useState<'home' | 'listings' | 'details'>('home');
  const [properties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const response = await fetch('/api/me', { cache: 'no-store' });
      const data = await response.json();

      if (!isMounted) {
        return;
      }

      if (data.user) {
        setUser(data.user);
        return;
      }

      setUser(null);
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setView('details');
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900 font-sans selection:bg-primary/30">
      <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={() => setView('home')}
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
              onClick={() => setView('listings')}
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
            onBrowse={() => setView('listings')}
            onPropertyClick={handlePropertyClick}
            properties={properties}
          />
        )}
        {view === 'listings' && (
          <ListingsView
            properties={properties}
            onPropertyClick={handlePropertyClick}
          />
        )}
        {view === 'details' && selectedProperty && (
          <PropertyDetailsView
            property={selectedProperty}
            onBack={() => setView('listings')}
            user={user}
          />
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white px-4 py-2 md:hidden">
        <button
          onClick={() => setView('home')}
          className={`flex flex-col items-center gap-1 ${
            view === 'home' ? 'text-primary' : 'text-slate-400'
          }`}
        >
          <Home className="size-5" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button
          onClick={() => setView('listings')}
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

function HomeView({
  onBrowse,
  onPropertyClick,
  properties,
}: {
  onBrowse: () => void;
  onPropertyClick: (p: Property) => void;
  properties: Property[];
}) {
  return (
    <div className="space-y-12">
      <section className="flex flex-col items-center gap-12 py-12 lg:flex-row">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            Nova Fase de Investimento Aberta
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Encontre sua proxima oportunidade de{' '}
            <span className="text-primary">investimento</span>
          </h1>
          <p className="max-w-xl text-lg text-slate-600">
            Acesse oportunidades imobiliarias exclusivas e propriedades de alto
            rendimento na palma da sua mao. Junte-se a mais de 25.000 investidores
            construindo patrimonio hoje.
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
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000"
              fill
              className="object-cover"
              alt="Hero"
              priority
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-6 right-6 rounded-xl border border-white/20 bg-white/90 p-4 shadow-lg backdrop-blur-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">
                    Ultima Oferta
                  </p>
                  <p className="text-sm font-bold text-slate-900">
                    Skyline Plaza, Chicago
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500">ROI Esperado</p>
                  <p className="text-sm font-bold text-green-600">12.4%</p>
                </div>
              </div>
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
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.slice(0, 3).map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              onClick={() => onPropertyClick(property)}
            />
          ))}
        </div>
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
  return (
    <div
      onClick={onClick}
      className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image
          src={property.image_url}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          alt={property.title}
          referrerPolicy="no-referrer"
        />
        <div className="absolute left-4 top-4 flex gap-2">
          {property.is_premium === 1 && (
            <span className="rounded-lg bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white shadow-lg">
              Premium
            </span>
          )}
          <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold uppercase text-white shadow-lg">
            Leilao
          </span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">
            ${property.price.toLocaleString()}
          </span>
          <div className="flex items-center gap-1 text-slate-500">
            <MapPin className="size-3" />
            <span className="text-xs">{property.location}</span>
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
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                Taxa Cap.
              </span>
              <span className="text-sm font-bold">{property.cap_rate}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400">
                ROI
              </span>
              <span className="text-sm font-bold">{property.roi}%</span>
            </div>
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
  properties,
  onPropertyClick,
}: {
  properties: Property[];
  onPropertyClick: (p: Property) => void;
}) {
  return (
    <div className="space-y-8">
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
              className="block w-full rounded-xl border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-primary/20"
              placeholder="Buscar por cidade, bairro ou CEP"
              type="text"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onClick={() => onPropertyClick(property)}
          />
        ))}
      </div>
    </div>
  );
}

function PropertyDetailsView({
  property,
  onBack,
  user,
}: {
  property: Property;
  onBack: () => void;
  user: UserType | null;
}) {
  const isLocked = property.is_premium === 1 && (!user || user.is_premium === 0);

  return (
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
          <div className="relative aspect-video overflow-hidden rounded-2xl shadow-xl">
            <Image
              src={property.image_url}
              fill
              className="object-cover"
              alt={property.title}
              referrerPolicy="no-referrer"
            />
            <div className="absolute left-4 top-4">
              <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-white shadow-lg">
                Imovel Premium
              </span>
            </div>
          </div>

          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
              <div>
                <h1 className="mb-2 text-3xl font-bold tracking-tight">{property.title}</h1>
                <p className="flex items-center gap-2 text-lg text-slate-500">
                  <MapPin className="size-5 text-primary" />
                  {isLocked ? 'Endereco Confidencial' : property.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">
                  ${property.price.toLocaleString()}
                </p>
                <p className="text-sm text-slate-400">Hipoteca Est.: $24,500/mes</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <FactCard icon={<Bed className="mx-auto mb-1 size-5 text-primary" />} label="Quartos" value={property.beds} />
              <FactCard icon={<Bath className="mx-auto mb-1 size-5 text-primary" />} label="Banheiros" value={property.baths} />
              <FactCard icon={<Square className="mx-auto mb-1 size-5 text-primary" />} label="Area (m2)" value={property.sqft.toLocaleString()} />
              <FactCard icon={<Calendar className="mx-auto mb-1 size-5 text-primary" />} label="Construido" value="2022" />
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Descricao</h3>
              <p className="leading-relaxed text-slate-600">{property.description}</p>
            </div>
          </div>

          {isLocked && (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/50 p-8 text-center backdrop-blur-sm">
                <div className="mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
                  <Lock className="size-8 text-primary" />
                </div>
                <h3 className="mb-3 text-2xl font-bold">Conteudo Bloqueado</h3>
                <p className="mb-8 max-w-md text-slate-600">
                  O acesso ao endereco exato, projecoes financeiras detalhadas e
                  documentacao legal e restrito a investidores verificados.
                </p>
                <button className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-bold text-white shadow-xl shadow-primary/20 transition-transform hover:scale-105">
                  <ShieldCheck className="size-5" />
                  Desbloquear Acesso Total
                </button>
                <p className="mt-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Requer Assinatura Premium
                </p>
              </div>
              <div className="pointer-events-none select-none space-y-8 opacity-20">
                <div className="h-48 rounded-xl bg-slate-200" />
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 rounded-xl bg-slate-200" />
                  <div className="h-24 rounded-xl bg-slate-200" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-xl font-bold">Resumo do Investimento</h3>
            <div className="space-y-4">
              <SummaryRow label="ROI Esperado" value={`${property.roi}%`} valueClassName="text-green-600" />
              <SummaryRow label="Taxa Cap." value={`${property.cap_rate}%`} valueClassName="text-primary" />
              <SummaryRow label="Tipo de Propriedade" value={property.type} />
            </div>
            <button className="w-full rounded-xl bg-primary py-4 font-bold text-white shadow-lg shadow-primary/20 transition-all hover:bg-primary/90">
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

          <div className="space-y-4 rounded-2xl border border-primary/10 bg-primary/5 p-6">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <span className="font-bold">Analise IA</span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600">
              Com base nas tendencias atuais de mercado em {property.location},
              esta propriedade mostra forte potencial de valorizacao a longo prazo.
              A taxa de capitalizacao esta 1,2% acima da media do bairro.
            </p>
            <button className="text-sm font-bold text-primary hover:underline">
              Ver Relatorio IA Completo
            </button>
          </div>
        </div>
      </div>
    </motion.div>
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
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className={`font-bold ${valueClassName ?? ''}`}>{value}</span>
    </div>
  );
}
