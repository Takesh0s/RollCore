import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/AppHeader';
import { COLORS } from '../../design/shared';

// Cabeçalho único das telas do grupo (tabs), no padrão do Figma:
// hambúrguer (abre o menu lateral), título e ícone de perfil.
function TabsHeader({ title }: { title: string }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingTop: insets.top, backgroundColor: COLORS.background }}>
      <AppHeader title={title} />
    </View>
  );
}

// No Figma não existe barra inferior: a navegação é toda pelo menu lateral.
// As abas continuam registradas aqui só para as rotas existirem; a barra fica
// escondida (tabBarStyle display none). Para trazer a barra de volta, troque
// por: tabBarStyle: undefined
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        header: ({ options }) => <TabsHeader title={options.title ?? ''} />,
        tabBarStyle: { display: 'none' },
      }}>
      <Tabs.Screen name="livraria" options={{ title: 'Livraria' }} />
      <Tabs.Screen name="dice" options={{ title: 'Grimório' }} />
      <Tabs.Screen name="explore" options={{ title: 'Busca' }} />
      <Tabs.Screen name="skills" options={{ title: 'Fichas' }} />
      <Tabs.Screen name="mesas" options={{ title: 'Mesas' }} />
    </Tabs>
  );
}
