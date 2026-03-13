'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  Menu, 
  X, 
  Home, 
  TrendingUp, 
  MessageSquare, 
  User, 
  LayoutDashboard, 
  Gavel, 
  Lock, 
  ChevronRight, 
  MapPin, 
  Bed, 
  Bath, 
  Square, 
  Calendar,
  Send,
  Sparkles,
  ArrowLeft,
  Share2,
  Heart,
  DollarSign,
  PieChart,
  ShieldCheck,
  Bell
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Property, User as UserType, ChatMessage } from '@/lib/types';

// Mock Data
const MOCK_PROPERTIES: Property[] = [
  {
    id: 1,
    title: "Skyline Plaza Luxury Apartment",
    description: "Apartamento de alto padrão com vista panorâmica para o centro da cidade. Totalmente mobiliado e com acabamentos de luxo.",
    price: 1250000,
    location: "Centro, São Paulo",
    image_url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1000",
    beds: 3,
    baths: 2,
    sqft: 1850,
    type: "Apartamento",
    roi: 12.4,
    cap_rate: 8.5,
    is_premium: 1
  },
  {
    id: 2,
    title: "Vila Oakwood Residence",
    description: "Casa contemporânea em condomínio fechado com segurança 24h e área de lazer completa. Ideal para famílias.",
    price: 850000,
    location: "Jardins, São Paulo",
    image_url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=1000",
    beds: 4,
    baths: 3,
    sqft: 2400,
    type: "Casa",
    roi: 10.2,
    cap_rate: 7.8,
    is_premium: 0
  },
  {
    id: 3,
    title: "Modern Loft Downtown",
    description: "Loft industrial moderno com pé direito duplo e design arrojado. Localização privilegiada próxima a centros comerciais.",
    price: 620000,
    location: "Vila Madalena, São Paulo",
    image_url: "https://images.unsplash.com/photo-1536376074432-a228d0a59cf4?auto=format&fit=crop&q=80&w=1000",
    beds: 1,
    baths: 1,
    sqft: 950,
    type: "Loft",
    roi: 14.8,
    cap_rate: 9.2,
    is_premium: 1
  },
  {
    id: 4,
    title: "Green Valley Estate",
    description: "Propriedade rural de luxo com haras e área verde preservada. Perfeita para quem busca tranquilidade e contato com a natureza.",
    price: 3450000,
    location: "Interior, São Paulo",
    image_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&q=80&w=1000",
    beds: 6,
    baths: 5,
    sqft: 12000,
    type: "Fazenda",
    roi: 8.5,
    cap_rate: 6.5,
    is_premium: 1
  }
];

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export default function App() {
  const [view, setView] = useState<'home' | 'listings' | 'details' | 'chat' | 'admin' | 'finance'>('home');
  const [properties, setProperties] = useState<Property[]>(MOCK_PROPERTIES);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [user, setUser] = useState<UserType | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handlePropertyClick = (property: Property) => {
    setSelectedProperty(property);
    setView('details');
  };

  const login = async () => {
    // Mock login
    const mockUser: UserType = {
      id: 1,
      email: 'investor@example.com',
      role: 'investor',
      is_premium: 1
    };
    setUser(mockUser);
  };

  return (
    <div className="min-h-screen bg-[#f6f7f8] text-slate-900 font-sans selection:bg-primary/30">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('home')}>
            <div className="bg-primary p-1.5 rounded-lg">
              <Home className="text-white size-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Nexo Leilões</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setView('listings')} className="text-sm font-medium hover:text-primary transition-colors">Oportunidades</button>
            <button onClick={() => setView('finance')} className="text-sm font-medium hover:text-primary transition-colors">Financeiro</button>
            <button onClick={() => setView('admin')} className="text-sm font-medium hover:text-primary transition-colors">Administração</button>
          </div>

          <div className="flex items-center gap-4">
            {!user ? (
              <button onClick={login} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-primary/90 transition-all">
                Criar conta
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium hidden sm:block">{user.email}</span>
                <div className="size-8 rounded-full bg-slate-200 overflow-hidden relative">
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

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-0 top-16 bg-white border-b border-slate-200 z-40 p-4 md:hidden"
          >
            <div className="flex flex-col gap-4">
              <button onClick={() => { setView('listings'); setIsMenuOpen(false); }} className="text-left font-medium">Oportunidades</button>
              <button onClick={() => { setView('finance'); setIsMenuOpen(false); }} className="text-left font-medium">Financeiro</button>
              <button onClick={() => { setView('admin'); setIsMenuOpen(false); }} className="text-left font-medium">Painel de Administração</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {view === 'home' && <HomeView onBrowse={() => setView('listings')} onPropertyClick={handlePropertyClick} properties={properties} />}
        {view === 'listings' && <ListingsView properties={properties} onPropertyClick={handlePropertyClick} />}
        {view === 'details' && selectedProperty && <PropertyDetailsView property={selectedProperty} onBack={() => setView('listings')} user={user} />}
        {view === 'admin' && <AdminDashboard />}
        {view === 'finance' && <FinanceView />}
      </main>

      {/* AI Chat Toggle */}
      <button 
        onClick={() => setView('chat')}
        className="fixed bottom-8 right-8 size-16 bg-primary text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-105 transition-transform z-50"
      >
        <MessageSquare className="size-8" />
      </button>

      {/* AI Chat Modal */}
      <AnimatePresence>
        {view === 'chat' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:right-8 sm:w-[400px] sm:h-[600px] bg-white sm:rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden"
          >
            <div className="bg-primary p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="size-5" />
                <span className="font-bold">Assistente de Investimento IA</span>
              </div>
              <button onClick={() => setView('home')}><X className="size-5" /></button>
            </div>
            <ChatInterface />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2 flex items-center justify-around md:hidden z-40">
        <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-primary' : 'text-slate-400'}`}>
          <Home className="size-5" />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setView('listings')} className={`flex flex-col items-center gap-1 ${view === 'listings' ? 'text-primary' : 'text-slate-400'}`}>
          <Search className="size-5" />
          <span className="text-[10px] font-bold">Buscar</span>
        </button>
        <button onClick={() => setView('finance')} className={`flex flex-col items-center gap-1 ${view === 'finance' ? 'text-primary' : 'text-slate-400'}`}>
          <TrendingUp className="size-5" />
          <span className="text-[10px] font-bold">Financeiro</span>
        </button>
        <button onClick={() => setView('admin')} className={`flex flex-col items-center gap-1 ${view === 'admin' ? 'text-primary' : 'text-slate-400'}`}>
          <LayoutDashboard className="size-5" />
          <span className="text-[10px] font-bold">Administração</span>
        </button>
      </div>
    </div>
  );
}

function HomeView({ onBrowse, onPropertyClick, properties }: { onBrowse: () => void, onPropertyClick: (p: Property) => void, properties: Property[] }) {
  return (
    <div className="space-y-12">
      <section className="py-12 flex flex-col lg:flex-row items-center gap-12">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-accent">
            Nova Fase de Investimento Aberta
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Encontre sua próxima oportunidade de <span className="text-primary">investimento</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl">
            Acesse oportunidades imobiliárias exclusivas e propriedades de alto rendimento na palma da sua mão. Junte-se a mais de 25.000 investidores construindo patrimônio hoje.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row">
            <button onClick={onBrowse} className="rounded-xl bg-primary px-8 py-4 text-base font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              Ver imóveis
            </button>
            <button className="rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 hover:bg-slate-50 transition-all">
              Saiba mais
            </button>
          </div>
        </div>
        <div className="flex-1 w-full">
          <div className="relative h-[300px] sm:h-[450px] w-full overflow-hidden rounded-2xl shadow-2xl">
            <Image 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1000" 
              fill
              className="object-cover" 
              alt="Hero"
              priority
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-6 right-6 rounded-xl bg-white/90 p-4 backdrop-blur-md shadow-lg border border-white/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase text-primary">Última Oferta</p>
                  <p className="text-sm font-bold text-slate-900">Skyline Plaza, Chicago</p>
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
          <h3 className="text-2xl font-bold text-slate-900">Oportunidades em destaque</h3>
          <button onClick={onBrowse} className="text-sm font-bold text-primary hover:underline">Ver todos</button>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {properties.slice(0, 3).map(property => (
            <PropertyCard key={property.id} property={property} onClick={() => onPropertyClick(property)} />
          ))}
        </div>
      </section>
    </div>
  );
}

function PropertyCard({ property, onClick }: { property: Property, onClick: () => void, key?: React.Key }) {
  return (
    <div 
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-xl cursor-pointer"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        <Image 
          src={property.image_url} 
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110" 
          alt={property.title}
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          {property.is_premium === 1 && (
            <span className="rounded-lg bg-primary px-2 py-1 text-[10px] font-bold uppercase text-white shadow-lg">Premium</span>
          )}
          <span className="rounded-lg bg-secondary px-2 py-1 text-[10px] font-bold uppercase text-white shadow-lg">Leilão</span>
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-lg font-bold text-primary">${property.price.toLocaleString()}</span>
          <div className="flex items-center gap-1 text-slate-500">
            <MapPin className="size-3" />
            <span className="text-xs">{property.location}</span>
          </div>
        </div>
        <h4 className="mb-2 text-lg font-bold text-slate-900 line-clamp-1">{property.title}</h4>
        <p className="mb-4 text-sm text-slate-600 line-clamp-2">{property.description}</p>
        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="flex gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">Taxa Cap.</span>
              <span className="text-sm font-bold">{property.cap_rate}%</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">ROI</span>
              <span className="text-sm font-bold">{property.roi}%</span>
            </div>
          </div>
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition-colors">Detalhes</button>
        </div>
      </div>
    </div>
  );
}

function ListingsView({ properties, onPropertyClick }: { properties: Property[], onPropertyClick: (p: Property) => void }) {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex-1 max-w-2xl">
          <label className="block text-sm font-medium text-slate-700 mb-2">Buscar Propriedades</label>
          <div className="relative group">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-primary transition-colors">
              <Search className="size-5" />
            </div>
            <input 
              className="block w-full rounded-xl border-slate-200 bg-white py-4 pl-12 pr-4 text-slate-900 placeholder:text-slate-400 focus:border-primary focus:ring-primary/20 transition-all outline-none" 
              placeholder="Buscar por cidade, bairro ou CEP" 
              type="text"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm">
            Filtros
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg bg-white border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700">
            Ordenar: Popular
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {properties.map(property => (
          <PropertyCard key={property.id} property={property} onClick={() => onPropertyClick(property)} />
        ))}
      </div>
    </div>
  );
}

function PropertyDetailsView({ property, onBack, user }: { property: Property, onBack: () => void, user: UserType | null }) {
  const isLocked = property.is_premium === 1 && (!user || user.is_premium === 0);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-8"
    >
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
        <ArrowLeft className="size-4" />
        Voltar para Imóveis
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="relative aspect-video rounded-2xl overflow-hidden shadow-xl">
            <Image 
              src={property.image_url} 
              fill
              className="object-cover" 
              alt={property.title} 
              referrerPolicy="no-referrer"
            />
            <div className="absolute top-4 left-4">
              <span className="bg-primary text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">Imóvel Premium</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight mb-2">{property.title}</h1>
                <p className="text-slate-500 text-lg flex items-center gap-2">
                  <MapPin className="text-primary size-5" />
                  {isLocked ? "Endereço Confidencial" : property.location}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-primary">${property.price.toLocaleString()}</p>
                <p className="text-slate-400 text-sm">Hipoteca Est.: $24,500/mês</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <Bed className="text-primary size-5 mx-auto mb-1" />
                <p className="text-xs text-slate-500 uppercase font-bold">Quartos</p>
                <p className="font-bold text-lg">{property.beds}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <Bath className="text-primary size-5 mx-auto mb-1" />
                <p className="text-xs text-slate-500 uppercase font-bold">Banheiros</p>
                <p className="font-bold text-lg">{property.baths}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <Square className="text-primary size-5 mx-auto mb-1" />
                <p className="text-xs text-slate-500 uppercase font-bold">Área (m²)</p>
                <p className="font-bold text-lg">{property.sqft.toLocaleString()}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                <Calendar className="text-primary size-5 mx-auto mb-1" />
                <p className="text-xs text-slate-500 uppercase font-bold">Construído</p>
                <p className="font-bold text-lg">2022</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-bold">Descrição</h3>
              <p className="text-slate-600 leading-relaxed">{property.description}</p>
            </div>
          </div>

          {isLocked && (
            <div className="relative p-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8 z-10">
                <div className="bg-primary/10 size-16 rounded-full flex items-center justify-center mb-6">
                  <Lock className="text-primary size-8" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Conteúdo Bloqueado</h3>
                <p className="text-slate-600 mb-8 max-w-md">
                  O acesso ao endereço exato, projeções financeiras detalhadas e documentação legal é restrito a investidores verificados.
                </p>
                <button className="bg-primary text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform flex items-center gap-2">
                  <ShieldCheck className="size-5" />
                  Desbloquear Acesso Total
                </button>
                <p className="text-[10px] text-slate-400 mt-4 uppercase tracking-widest font-bold">Requer Assinatura Premium</p>
              </div>
              <div className="opacity-20 select-none pointer-events-none space-y-8">
                <div className="h-48 bg-slate-200 rounded-xl"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-24 bg-slate-200 rounded-xl"></div>
                  <div className="h-24 bg-slate-200 rounded-xl"></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
            <h3 className="text-xl font-bold">Resumo do Investimento</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">ROI Esperado</span>
                <span className="font-bold text-green-600">{property.roi}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Taxa Cap.</span>
                <span className="font-bold text-primary">{property.cap_rate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Tipo de Propriedade</span>
                <span className="font-bold">{property.type}</span>
              </div>
            </div>
            <button className="w-full bg-primary text-white py-4 rounded-xl font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all">
              Solicitar Informações
            </button>
            <div className="flex gap-2">
              <button className="flex-1 border border-slate-200 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-50">
                <Share2 className="size-4" /> Compartilhar
              </button>
              <button className="flex-1 border border-slate-200 py-3 rounded-lg flex items-center justify-center gap-2 text-sm font-medium hover:bg-slate-50">
                <Heart className="size-4" /> Salvar
              </button>
            </div>
          </div>

          <div className="bg-primary/5 rounded-2xl p-6 border border-primary/10 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="size-5" />
              <span className="font-bold">Análise IA</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Com base nas tendências atuais de mercado em {property.location}, esta propriedade mostra forte potencial de valorização a longo prazo. A taxa de capitalização está 1,2% acima da média do bairro.
            </p>
            <button className="text-primary text-sm font-bold hover:underline">Ver Relatório IA Completo</button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Olá! Sou seu assistente de IA da Nexo Leilões. Como posso ajudar com seus investimentos imobiliários hoje?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const response = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ role: 'user', parts: [{ text: userMsg }] }],
        config: {
          systemInstruction: "Você é um assistente profissional de investimentos imobiliários da Nexo Leilões. Forneça conselhos baseados em dados sobre rendimentos de propriedades, tendências de mercado e estratégias de investimento. Seja conciso e profissional."
        }
      });
      
      const responseText = response.text || "Não foi possível gerar uma resposta.";
      setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'model', text: "Desculpe, encontrei um erro. Por favor, tente novamente." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl shadow-sm ${
              msg.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
            }`}>
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-slate-100 shadow-sm">
              <div className="flex gap-1">
                <div className="size-1.5 bg-primary rounded-full animate-bounce"></div>
                <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="size-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          <input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Pergunte sobre tendências de mercado..." 
            className="flex-1 bg-transparent border-none focus:ring-0 text-sm py-2"
          />
          <button onClick={handleSend} className="text-primary hover:scale-110 transition-transform">
            <Send className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [stats, setStats] = useState<any>({
    totalUsers: 25430,
    totalRevenue: 12450000,
    activeAuctions: 42
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Painel de Administração</h2>
        <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
          <Bell className="size-4" /> Notificações
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-sm font-medium">Total de Usuários</p>
            <User className="text-primary size-5" />
          </div>
          <p className="text-3xl font-bold">{stats.totalUsers.toLocaleString()}</p>
          <span className="text-green-600 text-xs font-bold">+12% desde o mês passado</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-sm font-medium">Receita Total</p>
            <DollarSign className="text-primary size-5" />
          </div>
          <p className="text-3xl font-bold">${stats.totalRevenue.toLocaleString()}</p>
          <span className="text-green-600 text-xs font-bold">+8% desde o mês passado</span>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <p className="text-slate-500 text-sm font-medium">Leilões Ativos</p>
            <Gavel className="text-primary size-5" />
          </div>
          <p className="text-3xl font-bold">{stats.activeAuctions}</p>
          <span className="text-red-600 text-xs font-bold">-3% que ontem</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold">Desempenho Regional</h3>
          <div className="space-y-4">
            {[
              { region: 'América do Norte', users: '5.230', revenue: '$120.400', status: 'Alto Crescimento' },
              { region: 'União Europeia', users: '4.120', revenue: '$98.300', status: 'Estável' },
              { region: 'Ásia-Pacífico', users: '2.940', revenue: '$76.100', status: 'Recuperando' }
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-bold">{row.region}</p>
                  <p className="text-xs text-slate-500">{row.users} Usuários</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-primary">{row.revenue}</p>
                  <p className="text-[10px] font-bold uppercase text-green-600">{row.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          <h3 className="text-lg font-bold">Tendências de Receita</h3>
          <div className="h-64 flex items-end justify-between gap-2 pt-8">
            {[60, 45, 80, 55, 70, 90].map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full bg-primary/20 rounded-t-lg hover:bg-primary transition-colors" style={{ height: `${h}%` }}></div>
                <span className="text-[10px] text-slate-400 font-bold uppercase">{['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FinanceView() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Visão Geral Financeira</h2>
        <div className="flex gap-2">
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Exportar PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Valor do Portfólio</p>
          <p className="text-3xl font-bold">$2.482.000</p>
          <p className="text-green-600 text-xs font-bold mt-2">+5.2% YTD</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Receita Mensal (MRR)</p>
          <p className="text-3xl font-bold">$12.450</p>
          <p className="text-green-600 text-xs font-bold mt-2">+0.8% vs mês passado</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Rendimento Médio</p>
          <p className="text-3xl font-bold">12.4%</p>
          <p className="text-slate-400 text-xs font-bold mt-2">Referência: 8.5%</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-slate-500 text-sm font-medium mb-1">Ativos Ativos</p>
          <p className="text-3xl font-bold">8</p>
          <p className="text-blue-600 text-xs font-bold mt-2">2 em reforma</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="font-bold">Transações Recentes</h3>
          <button className="text-primary text-sm font-bold">Ver Tudo</button>
        </div>
        <div className="divide-y divide-slate-100">
          {[
            { user: 'Sarah Jenkins', property: 'Apartamento Skyline #402', amount: '+$2.450,00', status: 'Pago', date: '24 Out' },
            { user: 'Michael Chen', property: 'Aluguel Vila Oakwood', amount: '+$1.800,00', status: 'Pendente', date: '23 Out' },
            { user: 'Robert Fox', property: 'Loft Moderno Centro', amount: '+$3.200,00', status: 'Falhou', date: '22 Out' }
          ].map((tx, i) => (
            <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-slate-100 rounded-full flex items-center justify-center">
                  <User className="size-5 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-sm">{tx.user}</p>
                  <p className="text-xs text-slate-500">{tx.property}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`font-bold text-sm ${tx.status === 'Falhou' ? 'text-red-600' : 'text-slate-900'}`}>{tx.amount}</p>
                <p className="text-[10px] font-bold uppercase text-slate-400">{tx.date}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
