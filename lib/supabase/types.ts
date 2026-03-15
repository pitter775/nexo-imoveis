export type UserRole = 'admin' | 'cliente';

export type Database = {
  public: {
    Tables: {
      imovel_imagens: {
        Row: {
          imovel_id: string;
          url: string;
          ordem: number | null;
        };
        Insert: {
          imovel_id: string;
          url: string;
          ordem?: number | null;
        };
        Update: {
          imovel_id?: string;
          url?: string;
          ordem?: number | null;
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
        };
        Insert: {
          id?: string;
          titulo: string;
          descricao?: string | null;
          tipo_leilao?: string | null;
          tipo_propriedade?: string | null;
          valor_avaliacao?: number | null;
          valor_minimo?: number | null;
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
        };
        Update: {
          id?: string;
          titulo?: string;
          descricao?: string | null;
          tipo_leilao?: string | null;
          tipo_propriedade?: string | null;
          valor_avaliacao?: number | null;
          valor_minimo?: number | null;
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
