import { StyleSheet, Text, View, ScrollView, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, ChevronRight, CheckCircle, Clock } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getKitnets, getLeituras } from '../../utils/api';
import { Kitnet, Leitura } from '../../utils/types';

export default function KitnetsScreen() {
  const [kitnets, setKitnets] = useState<Kitnet[]>([]);
  const [leituras, setLeituras] = useState<Leitura[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const [kits, leits] = await Promise.all([
        getKitnets(),
        getLeituras() // Pega as leituras recentes
      ]);
      setKitnets(kits);
      setLeituras(leits);
    } catch (error) {
      console.error('Erro ao carregar kitnets:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  const now = new Date();
  const mesAtualStr = now.toISOString().slice(0, 7); // "YYYY-MM"

  // Processa os dados para a lista
  const listaProcessada = kitnets.map(k => {
    const leiturasDestaKitnet = leituras.filter(l => l.kitnet_id === k.id);
    const leituraDesteMes = leiturasDestaKitnet.find(l => l.data_leitura.startsWith(mesAtualStr));
    
    return {
      ...k,
      lida: !!leituraDesteMes,
      consumo: leituraDesteMes?.consumo_kwh ?? null,
    };
  });

  const totalLidas = listaProcessada.filter(k => k.lida).length;
  const pendentes = kitnets.length - totalLidas;
  const consumoTotal = listaProcessada.reduce((acc, k) => acc + (k.consumo ?? 0), 0);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Unidades</Text>
        <Text style={styles.headerSub}>{kitnets.length} Kitnets cadastradas</Text>
      </View>

      {/* Summary bar */}
      <LinearGradient colors={['#4F46E5', '#7C3AED']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <CheckCircle size={16} color="#A5F3FC" />
          <Text style={styles.summaryLabel}> {totalLidas} Lidas</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Clock size={16} color="#FDE68A" />
          <Text style={styles.summaryLabel}> {pendentes} Pendentes</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Zap size={16} color="#6EE7B7" />
          <Text style={styles.summaryLabel}> {consumoTotal} kWh total</Text>
        </View>
      </LinearGradient>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={listaProcessada}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card} activeOpacity={0.75}>
              <View style={[styles.statusDot, { backgroundColor: item.lida ? '#10B981' : '#F59E0B' }]} />
              <View style={styles.cardLeft}>
                <View style={styles.cardTitleRow}>
                  <Text style={styles.kitnetName}>{item.nome_unidade}</Text>
                  <View style={[styles.badge, item.lida ? styles.badgeLida : styles.badgePendente]}>
                    <Text style={[styles.badgeText, item.lida ? styles.badgeTextLida : styles.badgeTextPendente]}>
                      {item.lida ? 'Lida' : 'Pendente'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.morador}>{item.morador_atual || 'Sem morador'}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.metaText}>Medidor: {item.numero_medidor}</Text>
                  {item.lida && (
                    <Text style={styles.metaText}>· {item.consumo} kWh</Text>
                  )}
                </View>
              </View>
              <ChevronRight size={20} color="#475569" />
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '600',
  },
  summaryBar: {
    marginHorizontal: 24,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabel: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  summaryDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  list: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    flexShrink: 0,
  },
  cardLeft: {
    flex: 1,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  kitnetName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeLida: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgePendente: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  badgeTextLida: {
    color: '#10B981',
  },
  badgeTextPendente: {
    color: '#F59E0B',
  },
  morador: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
});
