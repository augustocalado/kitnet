import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera, Zap, Info } from 'lucide-react-native';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getKitnets, getUltimaLeitura, getValorKwh, inserirLeitura } from '../../utils/api';
import { Kitnet, Leitura } from '../../utils/types';

export default function CameraScreen() {
  const [kitnets, setKitnets] = useState<Kitnet[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [ultimaLeitura, setUltimaLeitura] = useState<Leitura | null>(null);
  const [valorKwh, setValorKwh] = useState(0.95);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reading, setReading] = useState<string | null>(null);

  const carregarIniciais = async () => {
    try {
      setLoading(true);
      const [kits, kwh] = await Promise.all([getKitnets(), getValorKwh()]);
      setKitnets(kits);
      setValorKwh(kwh);
      if (kits.length > 0) setSelectedId(kits[0].id);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarIniciais();
    }, [])
  );

  useEffect(() => {
    if (selectedId) {
      getUltimaLeitura(selectedId).then(setUltimaLeitura).catch(console.error);
      setReading(null); // reseta leitura ao trocar de kitnet
    }
  }, [selectedId]);

  const handleCapture = () => {
    Alert.alert(
      'Função de Câmera',
      'Em produção, isso abre a câmera e o Google Vision OCR lê o visor. Vamos simular uma leitura fictícia para testes.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Simular Leitura', 
          onPress: () => {
            const mockReading = (ultimaLeitura?.valor_leitura ?? 1200) + Math.floor(Math.random() * 150) + 50;
            setReading(mockReading.toString());
          }
        }
      ]
    );
  };

  const handleSubmit = async () => {
    if (!selectedId || !reading) return;
    try {
      setSubmitting(true);
      const nova = await inserirLeitura({
        kitnet_id: selectedId,
        valor_leitura: Number(reading),
        valor_kwh: valorKwh,
        observacao: 'Inserido manualmente / simulado'
      });
      Alert.alert('Sucesso', 'Leitura salva com sucesso no Supabase!');
      setReading(null);
      // Atualiza a ultima leitura na tela
      getUltimaLeitura(selectedId).then(setUltimaLeitura);
    } catch (error: any) {
      Alert.alert('Erro', error.message ?? 'Não foi possível salvar.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedKitnet = kitnets.find(k => k.id === selectedId);
  const consumoKwh = reading ? Number(reading) - (ultimaLeitura?.valor_leitura ?? 0) : 0;
  const estimado = consumoKwh * valorKwh;

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ler Medidor</Text>
          <Text style={styles.headerSub}>Selecione a unidade e tire a foto</Text>
        </View>

        {/* Kitnet Selector */}
        <Text style={styles.label}>Unidade</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorRow} contentContainerStyle={{ gap: 8, paddingRight: 24 }}>
          {kitnets.map((k) => (
            <TouchableOpacity
              key={k.id}
              style={[styles.selectorChip, selectedId === k.id && styles.selectorChipActive]}
              onPress={() => setSelectedId(k.id)}
            >
              <Text style={[styles.selectorText, selectedId === k.id && styles.selectorTextActive]}>
                {k.nome_unidade}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Info size={16} color="#818CF8" />
          <Text style={styles.infoText}>
            Leitura anterior: <Text style={{ color: '#FFF' }}>{ultimaLeitura?.valor_leitura ? `${ultimaLeitura.valor_leitura} kWh` : 'Nenhuma'}</Text>
          </Text>
        </View>

        {/* Camera viewfinder */}
        <TouchableOpacity onPress={handleCapture} activeOpacity={0.85} style={styles.viewfinderWrapper}>
          <LinearGradient
            colors={['#1E293B', '#0F172A']}
            style={styles.viewfinder}
          >
            <View style={styles.cornerTL} />
            <View style={styles.cornerTR} />
            <View style={styles.cornerBL} />
            <View style={styles.cornerBR} />
            <Camera size={56} color="#4F46E5" />
            <Text style={styles.viewfinderText}>Toque para abrir a câmera</Text>
            <Text style={styles.viewfinderSub}>O OCR detectará o número automaticamente</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Result */}
        {reading && (
          <View style={styles.resultCard}>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Leitura detectada:</Text>
              <Text style={styles.resultValue}>{reading} kWh</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Anterior:</Text>
              <Text style={styles.resultValueSub}>{ultimaLeitura?.valor_leitura ?? 0} kWh</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Consumo:</Text>
              <Text style={[styles.resultValue, { color: '#10B981' }]}>{consumoKwh > 0 ? consumoKwh : 0} kWh</Text>
            </View>
            <View style={styles.resultRow}>
              <Text style={styles.resultLabel}>Valor estimado:</Text>
              <Text style={[styles.resultValue, { color: '#FBBF24' }]}>R$ {estimado > 0 ? estimado.toFixed(2) : '0.00'}</Text>
            </View>

            <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={styles.submitBtn}>
              {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Salvar no Supabase</Text>}
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '600' },
  label: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  selectorRow: { marginBottom: 20, marginHorizontal: -24, paddingLeft: 24 },
  selectorChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  selectorChipActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
  },
  selectorText: { color: '#64748B', fontWeight: '600', fontSize: 14 },
  selectorTextActive: { color: '#FFFFFF' },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.2)',
  },
  infoText: { color: '#94A3B8', fontSize: 14, flex: 1 },
  viewfinderWrapper: { borderRadius: 24, overflow: 'hidden', marginBottom: 20 },
  viewfinder: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(79, 70, 229, 0.3)',
    borderRadius: 24,
  },
  cornerTL: { position: 'absolute', top: 16, left: 16, width: 30, height: 30, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#4F46E5', borderTopLeftRadius: 8 },
  cornerTR: { position: 'absolute', top: 16, right: 16, width: 30, height: 30, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#4F46E5', borderTopRightRadius: 8 },
  cornerBL: { position: 'absolute', bottom: 16, left: 16, width: 30, height: 30, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#4F46E5', borderBottomLeftRadius: 8 },
  cornerBR: { position: 'absolute', bottom: 16, right: 16, width: 30, height: 30, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#4F46E5', borderBottomRightRadius: 8 },
  viewfinderText: { color: '#CBD5E1', fontSize: 16, fontWeight: '600' },
  viewfinderSub: { color: '#475569', fontSize: 13 },
  resultCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 20,
  },
  resultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  resultLabel: { color: '#64748B', fontSize: 14, fontWeight: '500' },
  resultValue: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  resultValueSub: { color: '#94A3B8', fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)' },
  submitBtn: {
    marginTop: 12,
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
});
