export type UserRole = 'admin' | 'cliente';

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string | null;
          tipo_usuario: UserRole;
        };
        Insert: {
          id: string;
          email?: string | null;
          tipo_usuario: UserRole;
        };
        Update: {
          id?: string;
          email?: string | null;
          tipo_usuario?: UserRole;
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
