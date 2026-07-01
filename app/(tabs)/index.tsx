import { StyleSheet, Text, View, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { getDashboardResumo } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const resumo = await getDashboardResumo();
      setData(resumo);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      carregarDados();
    }, [])
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Bem-vindo, {user?.user_metadata?.nome || 'Síndico'}</Text>
            <Text style={styles.headerTitle}>Visão Geral</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{(user?.user_metadata?.nome || 'S')[0].toUpperCase()}</Text>
          </View>
        </View>

        {loading ? (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4F46E5" />
            <Text style={{ color: '#94A3B8', marginTop: 12 }}>Carregando dados do Supabase...</Text>
          </View>
        ) : (
          <>
            {/* MAIN CARD (GRADIENT) */}
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainCard}
            >
              <View style={styles.mainCardHeader}>
                <Text style={styles.mainCardTitle}>Consumo Total (Mês)</Text>
                <Zap size={24} color="#FFF" />
              </View>
              <View style={styles.mainCardBody}>
                <Text style={styles.mainValue}>{data?.totalKwh ?? 0} <Text style={styles.mainUnit}>kWh</Text></Text>
                <View style={styles.pillContainer}>
                  <Text style={styles.pillText}>R$ {data?.totalValor?.toFixed(2) ?? '0.00'} Est.</Text>
                </View>
              </View>
            </LinearGradient>

            {/* STATS GRID */}
            <View style={styles.statsGrid}>
              {/* Maior Consumo */}
              <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
                  <TrendingUp size={20} color="#EF4444" />
                </View>
                <Text style={styles.statLabel}>Maior Gasto</Text>
                <Text style={styles.statValue}>{data?.maiorConsumo?.nome ?? '-'}</Text>
                <Text style={styles.statSubValue}>{data?.maiorConsumo?.kwh ? `${data.maiorConsumo.kwh} kWh` : '-'}</Text>
              </View>

              {/* Menor Consumo */}
              <View style={styles.statCard}>
                <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <TrendingDown size={20} color="#10B981" />
                </View>
                <Text style={styles.statLabel}>Menor Gasto</Text>
                <Text style={styles.statValue}>{data?.menorConsumo?.nome ?? '-'}</Text>
                <Text style={styles.statSubValue}>{data?.menorConsumo?.kwh ? `${data.menorConsumo.kwh} kWh` : '-'}</Text>
              </View>
            </View>

            {/* ALERTS SECTION */}
            <Text style={styles.sectionTitle}>Pendências</Text>
            {data?.pendentes?.length > 0 ? (
              <View style={styles.alertCard}>
                <View style={styles.alertIcon}>
                  <AlertCircle size={24} color="#F59E0B" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>{data.pendentes.length} Leituras Faltando</Text>
                  <Text style={styles.alertDesc}>
                    {data.pendentes.join(', ')} ainda não tiveram a leitura registrada neste mês.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={[styles.alertCard, { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.2)' }]}>
                <View style={styles.alertIcon}>
                  <AlertCircle size={24} color="#10B981" />
                </View>
                <View style={styles.alertContent}>
                  <Text style={[styles.alertTitle, { color: '#34D399' }]}>Tudo Certo!</Text>
                  <Text style={styles.alertDesc}>
                    Todas as {data?.totalKitnets} kitnets já tiveram leitura registrada este mês.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A', // Deep dark blue background
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 10,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  avatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4F46E5',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  mainCard: {
    borderRadius: 28,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  mainCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  mainCardTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  mainCardBody: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  mainValue: {
    fontSize: 48,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  mainUnit: {
    fontSize: 24,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pillContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 12,
  },
  pillText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  statCard: {
    width: (width - 48 - 16) / 2, // 50% width minus padding and gap
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statLabel: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statSubValue: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
  },
  alertIcon: {
    marginRight: 16,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 13,
    color: '#FDE68A',
    lineHeight: 20,
  },
});
