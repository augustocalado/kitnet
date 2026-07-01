import { supabase } from './supabase';
import { Kitnet, Leitura, NovaLeitura, NovaKitnet, ConfigSistema } from './types';

// ============================================================
// KITNETS
// ============================================================

export async function getKitnets(): Promise<Kitnet[]> {
  const { data, error } = await supabase
    .from('kitnets')
    .select('*')
    .order('nome_unidade');
  if (error) throw error;
  return data ?? [];
}

export async function updateKitnet(id: string, updates: Partial<NovaKitnet>) {
  const { error } = await supabase
    .from('kitnets')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// ============================================================
// LEITURAS
// ============================================================

export async function getLeituras(kitnetId?: string): Promise<Leitura[]> {
  let query = supabase
    .from('leituras')
    .select('*, kitnet:kitnets(nome_unidade, numero_medidor)')
    .order('data_leitura', { ascending: false })
    .order('created_at', { ascending: false });

  if (kitnetId) {
    query = query.eq('kitnet_id', kitnetId);
  }

  const { data, error } = await query.limit(100);
  if (error) throw error;
  return data ?? [];
}

export async function getUltimaLeitura(kitnetId: string): Promise<Leitura | null> {
  const { data, error } = await supabase
    .from('leituras')
    .select('*')
    .eq('kitnet_id', kitnetId)
    .order('data_leitura', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function inserirLeitura(leitura: NovaLeitura): Promise<Leitura> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('leituras')
    .insert({
      ...leitura,
      created_by: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Upload de foto para o Supabase Storage
export async function uploadFotoMedidor(
  kitnetId: string,
  uri: string,
  fileName: string
): Promise<string> {
  const response = await fetch(uri);
  const blob = await response.blob();
  const path = `${kitnetId}/${Date.now()}_${fileName}`;

  const { error } = await supabase.storage
    .from('leituras-fotos')
    .upload(path, blob, { contentType: 'image/jpeg', upsert: false });

  if (error) throw error;

  const { data } = supabase.storage
    .from('leituras-fotos')
    .getPublicUrl(path);

  return data.publicUrl;
}

// ============================================================
// CONFIG DO SISTEMA
// ============================================================

export async function getValorKwh(): Promise<number> {
  const { data, error } = await supabase
    .from('config_sistema')
    .select('valor_kwh')
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.valor_kwh ?? 0.95;
}

export async function updateValorKwh(valorKwh: number): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado');

  // Update existing or insert
  const { data: existing } = await supabase
    .from('config_sistema')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('config_sistema')
      .update({ valor_kwh: valorKwh, updated_at: new Date().toISOString(), updated_by: user.id })
      .eq('id', existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('config_sistema')
      .insert({ valor_kwh: valorKwh, updated_by: user.id });
    if (error) throw error;
  }
}

// ============================================================
// DASHBOARD — Resumo do mês atual
// ============================================================

export async function getDashboardResumo() {
  const now = new Date();
  const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  const fimMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

  const { data: leiturasMes, error } = await supabase
    .from('leituras')
    .select('*, kitnet:kitnets(nome_unidade)')
    .gte('data_leitura', inicioMes)
    .lte('data_leitura', fimMes);

  if (error) throw error;

  const { data: kitnets } = await supabase.from('kitnets').select('id, nome_unidade').eq('ativa', true);

  const totalKwh = leiturasMes?.reduce((acc, l) => acc + (l.consumo_kwh ?? 0), 0) ?? 0;
  const totalValor = leiturasMes?.reduce((acc, l) => acc + (l.valor_estimado ?? 0), 0) ?? 0;

  const maiorConsumo = leiturasMes?.reduce((max, l) =>
    (l.consumo_kwh ?? 0) > (max?.consumo_kwh ?? 0) ? l : max, null as any);

  const menorConsumo = leiturasMes?.filter(l => l.consumo_kwh && l.consumo_kwh > 0)
    .reduce((min, l) =>
      (l.consumo_kwh ?? 999999) < (min?.consumo_kwh ?? 999999) ? l : min, null as any);

  const lidas = new Set(leiturasMes?.map(l => l.kitnet_id));
  const pendentes = (kitnets ?? []).filter(k => !lidas.has(k.id));

  return {
    totalKwh,
    totalValor,
    maiorConsumo: maiorConsumo ? {
      nome: maiorConsumo.kitnet?.nome_unidade,
      kwh: maiorConsumo.consumo_kwh,
    } : null,
    menorConsumo: menorConsumo ? {
      nome: menorConsumo.kitnet?.nome_unidade,
      kwh: menorConsumo.consumo_kwh,
    } : null,
    pendentes: pendentes.map(k => k.nome_unidade),
    totalLidas: lidas.size,
    totalKitnets: kitnets?.length ?? 11,
  };
}
