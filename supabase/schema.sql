-- ============================================================
-- KITNET ENERGIA — Schema do Banco de Dados (Supabase)
-- Execute este SQL no Supabase > SQL Editor
-- ============================================================

-- 1. PROFILES (extensão da tabela auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  nome        TEXT NOT NULL DEFAULT 'Síndico',
  role        TEXT NOT NULL DEFAULT 'sindico' CHECK (role IN ('sindico', 'admin')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuário vê apenas o próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuário atualiza o próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao criar usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Síndico')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. KITNETS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.kitnets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_unidade    TEXT NOT NULL,       -- "Kitnet 01"
  numero_medidor  TEXT NOT NULL,       -- "MED-001"
  morador_atual   TEXT,
  ativa           BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.kitnets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem kitnets"
  ON public.kitnets FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Autenticados modificam kitnets"
  ON public.kitnets FOR ALL
  TO authenticated USING (TRUE);

-- Seed: inserir as 11 kitnets automaticamente
INSERT INTO public.kitnets (nome_unidade, numero_medidor) VALUES
  ('Kitnet 01', 'MED-001'),
  ('Kitnet 02', 'MED-002'),
  ('Kitnet 03', 'MED-003'),
  ('Kitnet 04', 'MED-004'),
  ('Kitnet 05', 'MED-005'),
  ('Kitnet 06', 'MED-006'),
  ('Kitnet 07', 'MED-007'),
  ('Kitnet 08', 'MED-008'),
  ('Kitnet 09', 'MED-009'),
  ('Kitnet 10', 'MED-010'),
  ('Kitnet 11', 'MED-011')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 3. LEITURAS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.leituras (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kitnet_id        UUID NOT NULL REFERENCES public.kitnets(id) ON DELETE CASCADE,
  data_leitura     DATE NOT NULL DEFAULT CURRENT_DATE,
  valor_leitura    NUMERIC(10,2) NOT NULL,   -- leitura atual do medidor
  leitura_anterior NUMERIC(10,2),            -- leitura anterior (preenchida automaticamente)
  consumo_kwh      NUMERIC(10,2),            -- calculado: atual - anterior
  valor_kwh        NUMERIC(10,4) NOT NULL DEFAULT 0.9500, -- tarifa R$/kWh
  valor_estimado   NUMERIC(10,2),            -- consumo_kwh * valor_kwh
  foto_url         TEXT,                     -- URL no Supabase Storage
  observacao       TEXT,
  created_by       UUID NOT NULL REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.leituras ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem leituras"
  ON public.leituras FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Autenticados inserem leituras"
  ON public.leituras FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Autenticados atualizam próprias leituras"
  ON public.leituras FOR UPDATE
  TO authenticated USING (auth.uid() = created_by);

-- Trigger: calcula consumo e valor automaticamente ao inserir
CREATE OR REPLACE FUNCTION public.calcular_consumo()
RETURNS TRIGGER AS $$
DECLARE
  ant NUMERIC;
BEGIN
  -- Busca a leitura mais recente anterior desta kitnet
  SELECT valor_leitura INTO ant
  FROM public.leituras
  WHERE kitnet_id = NEW.kitnet_id
    AND id != NEW.id
  ORDER BY data_leitura DESC, created_at DESC
  LIMIT 1;

  NEW.leitura_anterior := ant;

  IF ant IS NOT NULL AND NEW.valor_leitura > ant THEN
    NEW.consumo_kwh   := NEW.valor_leitura - ant;
    NEW.valor_estimado := ROUND(NEW.consumo_kwh * NEW.valor_kwh, 2);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS calcular_consumo_trigger ON public.leituras;
CREATE TRIGGER calcular_consumo_trigger
  BEFORE INSERT ON public.leituras
  FOR EACH ROW EXECUTE FUNCTION public.calcular_consumo();

-- ============================================================
-- 4. CONFIG DO SISTEMA (tarifa do kWh)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.config_sistema (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  valor_kwh   NUMERIC(10,4) NOT NULL DEFAULT 0.9500,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by  UUID REFERENCES public.profiles(id)
);

ALTER TABLE public.config_sistema ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Autenticados leem config"
  ON public.config_sistema FOR SELECT
  TO authenticated USING (TRUE);

CREATE POLICY "Autenticados atualizam config"
  ON public.config_sistema FOR ALL
  TO authenticated USING (TRUE);

-- Seed: inserir config padrão
INSERT INTO public.config_sistema (valor_kwh)
VALUES (0.9500)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. STORAGE — Bucket para fotos dos medidores
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('leituras-fotos', 'leituras-fotos', TRUE)
ON CONFLICT DO NOTHING;

CREATE POLICY "Qualquer autenticado pode fazer upload de fotos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'leituras-fotos');

CREATE POLICY "Fotos são públicas para leitura"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'leituras-fotos');
