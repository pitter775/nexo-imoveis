export interface Property {
  id: string;
  title: string;
  description: string;
  price: number;
  valuation_price?: number | null;
  location: string;
  city?: string | null;
  state?: string | null;
  address?: string;
  type: string;
  auction_type?: string;
  auction_date?: string | null;
  status?: string;
  sqft?: number | null;
  built_area?: number | null;
  beds?: number | null;
  baths?: number | null;
  year_built?: number | null;
  image_url: string;
  images?: string[];
  created_at?: string | null;
  cep?: string | null;
  dossier?: {
    resumo_executivo?: string | null;
    ocupacao?: string | null;
    matricula?: string | null;
    cartorio?: string | null;
    numero_processo?: string | null;
    valor_mercado?: number | null;
    lance_recomendado?: number | null;
    lucro_estimado?: number | null;
    roi_estimado?: number | null;
    divida_iptu?: number | null;
    divida_condominio?: number | null;
    analise?: string | null;
    riscos?: string | null;
    observacoes_juridicas?: string | null;
    estrategia?: string | null;
  } | null;
  dossier_files?: Array<{
    id: string;
    nome_arquivo?: string | null;
    url_storage?: string | null;
    tipo_arquivo?: string | null;
    tipo_documento?: string | null;
    visivel_publico?: boolean | null;
    visivel_pagantes?: boolean | null;
    created_at?: string | null;
  }>;
}

export interface User {
  id: number | string;
  email: string;
  role?: string;
  tipo_usuario?: 'admin' | 'cliente';
  is_premium?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface AppUserProfile {
  id: string;
  nome?: string | null;
  email: string;
  tipo_usuario: 'admin' | 'cliente';
}
