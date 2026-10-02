import type { Database, Json } from '@/lib/supabase/types';

export type ManagedSubscription = Database['public']['Tables']['assinaturas']['Row'] & {
  plano: string;
  metodo: string | null;
  proxima_cobranca: string | null;
  pago_ate: string | null;
  provider_updated_at: string | null;
  checkout_url: string | null;
  conciliado_em: string | null;
  erro_conciliacao: string | null;
  acesso_manual: 'concedido' | 'suspenso' | null;
  acesso_manual_ate: string | null;
};

export type SubscriptionCharge = {
  id: string;
  assinatura_id: string;
  referencia_gateway: string;
  pagamento_gateway: string | null;
  status: string;
  valor: number;
  moeda: string;
  metodo: string | null;
  vencimento: string;
  periodo_fim: string;
  pago_em: string | null;
  provider_updated_at: string;
  created_at: string;
  updated_at: string;
};

export type SubscriptionAudit = {
  id: string;
  assinatura_id: string;
  administrador_id: string;
  acao: string;
  motivo: string;
  estado_anterior: Json;
  estado_novo: Json;
  created_at: string;
};

type Table<Row> = { Row: Row; Insert: Partial<Row>; Update: Partial<Row>; Relationships: [] };
type SubscriptionNotice = {
  id: string; assinatura_id: string; referencia_gateway: string; tipo: 'recusado' | 'pago';
  enviado_em: string | null; reservado_ate: string | null; created_at: string;
};

// Extensao planejada: ativar somente apos aplicar o SQL. O schema de referencia permanece intacto.
export type SubscriptionDatabase = Omit<Database, 'public'> & {
  public: Omit<Database['public'], 'Tables' | 'Functions'> & {
    Tables: Omit<Database['public']['Tables'], 'assinaturas'> & {
      assinaturas: Table<ManagedSubscription>;
      assinatura_cobrancas: Table<SubscriptionCharge>;
      assinatura_auditoria: Table<SubscriptionAudit>;
      assinatura_avisos: Table<SubscriptionNotice>;
    };
    Functions: {
      conceder_cortesia_assinatura: { Args: { p_email: string; p_administrador: string; p_motivo: string; p_ate: string }; Returns: string };
      metricas_assinaturas: { Args: Record<string, never>; Returns: Json };
      reservar_assinatura: { Args: { p_usuario: string; p_imovel: string | null; p_email: string; p_valor: number }; Returns: Json };
      reservar_avisos_assinatura: { Args: Record<string, never>; Returns: SubscriptionNotice[] };
      sync_assinatura_cobranca: { Args: { p_cobranca: Json }; Returns: undefined };
      alterar_acesso_assinatura: {
        Args: { p_assinatura: string; p_administrador: string; p_acao: string; p_motivo: string; p_ate: string | null };
        Returns: undefined;
      };
    };
  };
};
