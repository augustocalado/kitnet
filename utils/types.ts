// ============================================================
// Tipos TypeScript espelhando as tabelas do Supabase
// ============================================================

export type Profile = {
  id: string;
  email: string;
  nome: string;
  role: 'sindico' | 'admin';
  created_at: string;
};

export type Kitnet = {
  id: string;
  nome_unidade: string;      // Ex: "Kitnet 01"
  numero_medidor: string;    // Ex: "MED-001"
  morador_atual: string | null;
  ativa: boolean;
  created_at: string;
  updated_at: string;
};

export type Leitura = {
  id: string;
  kitnet_id: string;
  data_leitura: string;          // ISO date string
  valor_leitura: number;         // kWh do medidor no momento
  leitura_anterior: number | null;
  consumo_kwh: number | null;    // calculado: atual - anterior
  valor_kwh: number;             // preço do kWh (R$)
  valor_estimado: number | null; // consumo_kwh * valor_kwh
  foto_url: string | null;       // URL do arquivo no Supabase Storage
  observacao: string | null;
  created_by: string;            // profile.id do síndico
  created_at: string;
  // Joins opcionais
  kitnet?: Kitnet;
};

export type ConfigSistema = {
  id: string;
  valor_kwh: number;             // Tarifa atual da concessionária
  updated_at: string;
  updated_by: string;
};

// Tipos auxiliares para formulários
export type NovaLeitura = {
  kitnet_id: string;
  valor_leitura: number;
  valor_kwh: number;
  foto_url?: string;
  observacao?: string;
};

export type NovaKitnet = {
  nome_unidade: string;
  numero_medidor: string;
  morador_atual?: string;
};
