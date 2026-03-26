export type UserRole = 'admin' | 'cliente';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      chat_conversas: {
        Row: {
          id: string;
          user_id: string | null;
          imovel_id: string | null;
          tipo_chat: string;
          titulo: string | null;
          resumo: string | null;
          status: string;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          last_message_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          imovel_id?: string | null;
          tipo_chat?: string;
          titulo?: string | null;
          resumo?: string | null;
          status?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          imovel_id?: string | null;
          tipo_chat?: string;
          titulo?: string | null;
          resumo?: string | null;
          status?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string;
        };
        Relationships: [];
      };
      chat_mensagens: {
        Row: {
          id: string;
          conversa_id: string;
          role: string;
          conteudo: string;
          modelo: string | null;
          tokens_input: number | null;
          tokens_output: number | null;
          custo_estimado: number | null;
          origem: string;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversa_id: string;
          role: string;
          conteudo: string;
          modelo?: string | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          custo_estimado?: number | null;
          origem?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          conversa_id?: string;
          role?: string;
          conteudo?: string;
          modelo?: string | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          custo_estimado?: number | null;
          origem?: string;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Relationships: [];
      };
      imovel_imagens: {
        Row: {
          id: string;
          imovel_id: string;
          url: string;
          ordem: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          imovel_id: string;
          url: string;
          ordem?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          imovel_id?: string;
          url?: string;
          ordem?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      imovel_arquivos: {
        Row: {
          id: string;
          imovel_id: string | null;
          nome_arquivo: string | null;
          url_storage: string | null;
          tipo_arquivo: string | null;
          visivel_pagantes: boolean | null;
          created_at: string | null;
          tipo_documento: string | null;
          visivel_publico: boolean | null;
        };
        Insert: {
          id?: string;
          imovel_id?: string | null;
          nome_arquivo?: string | null;
          url_storage?: string | null;
          tipo_arquivo?: string | null;
          visivel_pagantes?: boolean | null;
          created_at?: string | null;
          tipo_documento?: string | null;
          visivel_publico?: boolean | null;
        };
        Update: {
          id?: string;
          imovel_id?: string | null;
          nome_arquivo?: string | null;
          url_storage?: string | null;
          tipo_arquivo?: string | null;
          visivel_pagantes?: boolean | null;
          created_at?: string | null;
          tipo_documento?: string | null;
          visivel_publico?: boolean | null;
        };
        Relationships: [];
      };
      imovel_arquivo_extracoes: {
        Row: {
          id: string;
          arquivo_id: string;
          imovel_id: string;
          status: string;
          texto_extraido: string | null;
          resumo: string | null;
          campos_extraidos: Json;
          erro: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          arquivo_id: string;
          imovel_id: string;
          status?: string;
          texto_extraido?: string | null;
          resumo?: string | null;
          campos_extraidos?: Json;
          erro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          arquivo_id?: string;
          imovel_id?: string;
          status?: string;
          texto_extraido?: string | null;
          resumo?: string | null;
          campos_extraidos?: Json;
          erro?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      imovel_detalhes: {
        Row: {
          id: string;
          imovel_id: string;
          resumo_executivo: string | null;
          ocupacao: string | null;
          matricula: string | null;
          cartorio: string | null;
          numero_processo: string | null;
          valor_mercado: number | null;
          lance_recomendado: number | null;
          lucro_estimado: number | null;
          roi_estimado: number | null;
          divida_iptu: number | null;
          divida_condominio: number | null;
          analise: string | null;
          riscos: string | null;
          observacoes_juridicas: string | null;
          estrategia: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          imovel_id: string;
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
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          imovel_id?: string;
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
          created_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      imoveis: {
        Row: {
          id: string;
          titulo: string;
          descricao: string | null;
          tipo_leilao: string | null;
          tipo_propriedade: string | null;
          valor_avaliacao: number | null;
          valor_minimo: number | null;
          data_primeiro_leilao: string | null;
          valor_primeiro_leilao: number | null;
          data_segundo_leilao: string | null;
          valor_segundo_leilao: number | null;
          quartos: number | null;
          banheiros: number | null;
          area_total: number | null;
          area_construida: number | null;
          ano_construcao: number | null;
          rua: string | null;
          numero: string | null;
          complemento: string | null;
          cidade: string | null;
          estado: string | null;
          cep: string | null;
          data_leilao: string | null;
          status: string | null;
          destaque: boolean;
          ordem_destaque: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          tipo_leilao?: string | null;
          tipo_propriedade?: string | null;
          valor_avaliacao?: number | null;
          valor_minimo?: number | null;
          data_primeiro_leilao?: string | null;
          valor_primeiro_leilao?: number | null;
          data_segundo_leilao?: string | null;
          valor_segundo_leilao?: number | null;
          quartos?: number | null;
          banheiros?: number | null;
          area_total?: number | null;
          area_construida?: number | null;
          ano_construcao?: number | null;
          rua?: string | null;
          numero?: string | null;
          complemento?: string | null;
          cidade?: string | null;
          estado?: string | null;
          cep?: string | null;
          data_leilao?: string | null;
          status?: string | null;
          destaque?: boolean;
          ordem_destaque?: number | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          tipo_leilao?: string | null;
          tipo_propriedade?: string | null;
          valor_avaliacao?: number | null;
          valor_minimo?: number | null;
          data_primeiro_leilao?: string | null;
          valor_primeiro_leilao?: number | null;
          data_segundo_leilao?: string | null;
          valor_segundo_leilao?: number | null;
          quartos?: number | null;
          banheiros?: number | null;
          area_total?: number | null;
          area_construida?: number | null;
          ano_construcao?: number | null;
          rua?: string | null;
          numero?: string | null;
          complemento?: string | null;
          cidade?: string | null;
          estado?: string | null;
          cep?: string | null;
          data_leilao?: string | null;
          status?: string | null;
          destaque?: boolean;
          ordem_destaque?: number | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      leiloes: {
        Row: {
          id: string;
          imovel_id: string | null;
          data_inicio: string | null;
          data_fim: string | null;
          valor_inicial: number | null;
          status: string | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          imovel_id?: string | null;
          data_inicio?: string | null;
          data_fim?: string | null;
          valor_inicial?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          imovel_id?: string | null;
          data_inicio?: string | null;
          data_fim?: string | null;
          valor_inicial?: number | null;
          status?: string | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
      users: {
        Row: {
          id: string;
          nome: string | null;
          email: string;
          senha_hash: string | null;
          tipo_usuario: UserRole | null;
          ativo: boolean | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          nome?: string | null;
          email: string;
          senha_hash?: string | null;
          tipo_usuario?: UserRole | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          nome?: string | null;
          email?: string;
          senha_hash?: string | null;
          tipo_usuario?: UserRole | null;
          ativo?: boolean | null;
          created_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
