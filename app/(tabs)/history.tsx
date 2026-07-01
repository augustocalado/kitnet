import { StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BarChart2, TrendingUp, Calendar } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getLeituras, getKitnets } from '../../utils/api';
import { Leitura, Kitnet } from '../../utils/types';

const { width } = Dimensions.get('window');
const BAR_MAX = 250;

export default function HistoryScreen() {
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [kitnets, setKitnets] = useState<Kitnet[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [leits, kits] = await Promise.all([getLeituras(), getKitnets()]);
      setLeituras(leits);
      setKitnets(kits);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  // Evolução Mensal (Total)
  const monthlyDataMap: Record<string, number> = {};
  leituras.forEach(l => {
    const mes = l.data_leitura.slice(0, 7); // YYYY-MM
    monthlyDataMap[mes] = (monthlyDataMap[mes] || 0) + (l.consumo_kwh || 0);
  });
  const monthlyData = Object.entries(monthlyDataMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([mes, kwh]) => ({
      month: mes.split('-')[1] + '/' + mes.split('-')[0].slice(2),
      kwh: Math.round(kwh)
    }));

  // Comparativo por Kitnet (Mês atual)
  const now = new Date();
  const mesAtualStr = now.toISOString().slice(0, 7);
  const kitnetData = kitnets.map(k => {
    const leituraMes = leituras.find(l => l.kitnet_id === k.id && l.data_leitura.startsWith(mesAtualStr));
    return {
      kitnet: k.nome_unidade.replace('Kitnet ', ''),
      kwh: Math.round(leituraMes?.consumo_kwh || 0),
    };
  }).filter(k => k.kwh > 0).sort((a, b) => b.kwh - a.kwh);

  const maxKwh = kitnetData.length > 0 ? Math.max(...kitnetData.map(d => d.kwh)) : 100;

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
          <Text style={styles.headerTitle}>Histórico</Text>
          <Text style={styles.headerSub}>Gráficos e leituras anteriores</Text>
        </View>

        {/* Monthly Evolution Chart */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <TrendingUp size={18} color="#818CF8" />
            <Text style={styles.sectionTitle}>Evolução Mensal (Total)</Text>
          </View>
          <View style={styles.chartCard}>
            <View style={styles.lineChart}>
              {monthlyData.length > 0 ? monthlyData.map((item, index) => {
                const height = Math.min((item.kwh / (BAR_MAX * 11)) * 100, 100);
                return (
                  <View key={index} style={styles.barGroup}>
                    <Text style={styles.barValue}>{item.kwh}</Text>
                    <LinearGradient
                      colors={['#818CF8', '#4F46E5']}
                      style={[styles.bar, { height: `${Math.max(height, 5)}%` }]}
                    />
                    <Text style={styles.barLabel}>{item.month}</Text>
                  </View>
                );
              }) : <Text style={{color: '#64748B'}}>Sem dados suficientes</Text>}
            </View>
          </View>
        </View>

        {/* Kitnet Comparison */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BarChart2 size={18} color="#34D399" />
            <Text style={styles.sectionTitle}>Comparativo por Kitnet ({mesAtualStr})</Text>
          </View>
          <View style={styles.chartCard}>
            {kitnetData.length > 0 ? kitnetData.map((item, index) => {
              const pct = (item.kwh / maxKwh) * 100;
              return (
                <View key={index} style={styles.hBarRow}>
                  <Text style={styles.hBarLabel}>K{item.kitnet}</Text>
                  <View style={styles.hBarTrack}>
                    <LinearGradient
                      colors={item.kwh === maxKwh ? ['#F87171', '#EF4444'] : ['#818CF8', '#4F46E5']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={[styles.hBar, { width: `${pct}%` }]}
                    />
                  </View>
                  <Text style={styles.hBarValue}>{item.kwh}</Text>
                </View>
              );
            }) : <Text style={{color: '#64748B'}}>Nenhuma leitura neste mês</Text>}
          </View>
        </View>

        {/* Recent Readings */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={18} color="#FBBF24" />
            <Text style={styles.sectionTitle}>Leituras Recentes</Text>
          </View>
          {leituras.slice(0, 15).map((item) => {
            const dt = new Date(item.data_leitura);
            const dateStr = `${dt.getDate().toString().padStart(2, '0')}/${(dt.getMonth()+1).toString().padStart(2, '0')}/${dt.getFullYear()}`;
            return (
              <View key={item.id} style={styles.readingCard}>
                <View style={styles.readingTop}>
                  <Text style={styles.readingKitnet}>{item.kitnet?.nome_unidade}</Text>
                  <Text style={styles.readingDate}>{dateStr}</Text>
                </View>
                <View style={styles.readingRow}>
                  <View style={styles.readingItem}>
                    <Text style={styles.readingItemLabel}>Anterior</Text>
                    <Text style={styles.readingItemValue}>{item.leitura_anterior ?? 0}</Text>
                  </View>
                  <View style={styles.arrow}><Text style={styles.arrowText}>→</Text></View>
                  <View style={styles.readingItem}>
                    <Text style={styles.readingItemLabel}>Atual</Text>
                    <Text style={styles.readingItemValue}>{item.valor_leitura}</Text>
                  </View>
                  <View style={styles.readingDivider} />
                  <View style={styles.readingItem}>
                    <Text style={styles.readingItemLabel}>Consumo</Text>
                    <Text style={[styles.readingItemValue, { color: '#818CF8' }]}>{item.consumo_kwh ?? 0} kWh</Text>
                  </View>
                  <View style={styles.readingItem}>
                    <Text style={styles.readingItemLabel}>Valor</Text>
                    <Text style={[styles.readingItemValue, { color: '#FBBF24' }]}>R$ {item.valor_estimado?.toFixed(2) ?? '0.00'}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  scroll: { padding: 24, paddingBottom: 60 },
  header: { marginBottom: 28 },
  headerTitle: { fontSize: 32, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4, fontWeight: '600' },
  section: { marginBottom: 32 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#CBD5E1' },
  chartCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  lineChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
  },
  barGroup: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
    height: '100%',
  },
  barValue: { fontSize: 10, color: '#64748B', fontWeight: '600' },
  bar: {
    width: 24,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  hBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  hBarLabel: { width: 28, fontSize: 12, color: '#64748B', fontWeight: '600', textAlign: 'right' },
  hBarTrack: {
    flex: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  hBar: {
    height: '100%',
    borderRadius: 5,
  },
  hBarValue: { width: 32, fontSize: 12, color: '#94A3B8', fontWeight: '600', textAlign: 'left' },
  readingCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  readingTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  readingKitnet: { fontSize: 15, fontWeight: '700', color: '#F1F5F9' },
  readingDate: { fontSize: 12, color: '#475569', fontWeight: '500' },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readingItem: { alignItems: 'center' },
  readingItemLabel: { fontSize: 10, color: '#475569', fontWeight: '600', marginBottom: 4 },
  readingItemValue: { fontSize: 14, fontWeight: '700', color: '#CBD5E1' },
  arrow: { paddingHorizontal: 2 },
  arrowText: { color: '#334155', fontSize: 16 },
  readingDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.08)', marginHorizontal: 4 },
});
