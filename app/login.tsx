import { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Zap, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Atenção', 'Preencha o e-mail e a senha.');
      return;
    }
    setLoading(true);
    try {
      await signIn(email.trim(), senha);
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Erro ao entrar', err.message ?? 'Verifique suas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>

          {/* Logo / Brand */}
          <View style={styles.brandContainer}>
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              style={styles.logoCircle}
            >
              <Zap size={36} color="#FFFFFF" />
            </LinearGradient>
            <Text style={styles.appName}>Minha Kitnet</Text>
            <Text style={styles.appSubtitle}>Controle de consumo de energia</Text>
          </View>

          {/* Card de login */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Acesso do Síndico</Text>
            <Text style={styles.cardSub}>Entre com suas credenciais para continuar</Text>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail</Text>
              <View style={styles.inputRow}>
                <Mail size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="sindico@kitnet.com.br"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Senha */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha</Text>
              <View style={styles.inputRow}>
                <Lock size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor="#475569"
                  secureTextEntry={!showSenha}
                  value={senha}
                  onChangeText={setSenha}
                />
                <TouchableOpacity onPress={() => setShowSenha(!showSenha)} style={styles.eyeBtn}>
                  {showSenha
                    ? <EyeOff size={18} color="#64748B" />
                    : <Eye size={18} color="#64748B" />
                  }
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão Entrar */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.85}
              style={styles.btnWrapper}
            >
              <LinearGradient
                colors={loading ? ['#334155', '#334155'] : ['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                {loading
                  ? <ActivityIndicator color="#FFFFFF" />
                  : <Text style={styles.btnText}>Entrar</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

          </View>

          {/* Rodapé */}
          <Text style={styles.footer}>
            Minha Kitnet v1.0 · Acesso restrito ao síndico
          </Text>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0F172A' },
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 28,
    gap: 32,
  },
  brandContainer: {
    alignItems: 'center',
    gap: 12,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 28,
    padding: 28,
    gap: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  cardSub: {
    fontSize: 14,
    color: '#64748B',
    marginTop: -12,
  },
  inputGroup: { gap: 8 },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 10,
  },
  inputIcon: { flexShrink: 0 },
  input: {
    flex: 1,
    color: '#F1F5F9',
    fontSize: 16,
    padding: 0,
  },
  eyeBtn: { padding: 4 },
  btnWrapper: { marginTop: 4 },
  btn: {
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  footer: {
    textAlign: 'center',
    color: '#334155',
    fontSize: 12,
    fontWeight: '500',
  },
});
