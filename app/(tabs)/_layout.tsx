import { Tabs } from 'expo-router';
import { Platform, TouchableOpacity, View } from 'react-native';
import { Home, Zap, Camera, History, LogOut } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  const { signOut } = useAuth();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#8B5CF6',
        tabBarInactiveTintColor: '#64748B',
        headerStyle: {
          backgroundColor: '#0F172A',
        },
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: 'bold',
          color: '#F8FAFC',
        },
        headerRight: () => (
          <TouchableOpacity onPress={signOut} style={{ marginRight: 16, padding: 8 }}>
            <LogOut size={24} color="#EF4444" />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#1E293B',
          backgroundColor: '#0F172A',
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          paddingTop: 10,
          height: Platform.OS === 'ios' ? 85 : 65,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          headerShown: false,
          tabBarIcon: ({ color }) => <Home size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="kitnets"
        options={{
          title: 'Unidades',
          tabBarIcon: ({ color }) => <Zap size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: 'Ler Medidor',
          tabBarIcon: ({ color }) => <Camera size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Histórico',
          tabBarIcon: ({ color }) => <History size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
