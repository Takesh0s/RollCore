import { MaterialIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../design/shared';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#E53935', // Vermelho destaque estilo D&D Beyond
        tabBarInactiveTintColor: COLORS.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopWidth: 1,
          borderTopColor: 'rgba(255,255,255,0.1)',
          // Altura e espaçamento seguro adaptados para telemóveis Samsung/Android
          height: 62 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: 'AtkinsonHyperlegible_700Bold',
          fontSize: 10,
        },
      }}>
      
      {/* 1. Library */}
      <Tabs.Screen
        name="livraria"
        options={{
          title: 'Library',
          tabBarIcon: ({ color }) => <MaterialIcons name="menu-book" size={24} color={color} />,
        }}
      />

      {/* 2. Listings */}
      <Tabs.Screen
        name="dice"
        options={{
          title: 'Listings',
          tabBarIcon: ({ color }) => <MaterialIcons name="list-alt" size={24} color={color} />,
        }}
      />

      {/* 3. Search */}
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Search',
          tabBarIcon: ({ color }) => <MaterialIcons name="search" size={24} color={color} />,
        }}
      />

      {/* 4. Characters */}
      <Tabs.Screen
        name="skills"
        options={{
          title: 'Characters',
          tabBarIcon: ({ color }) => <MaterialIcons name="person" size={24} color={color} />,
        }}
      />

      {/* 5. Campaigns */}
      <Tabs.Screen
        name="mesas"
        options={{
          title: 'Campaigns',
          tabBarIcon: ({ color }) => <MaterialIcons name="flag" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}