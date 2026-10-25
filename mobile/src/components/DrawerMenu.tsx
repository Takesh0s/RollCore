import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, ScrollView, StyleSheet, Text as NativeText, TouchableOpacity as NativeTouchableOpacity, View } from 'react-native';
import { AccessibleText as Text, AccessibleTouchableOpacity as TouchableOpacity } from './accessible-text';
import { COLORS, appFontSize } from '../design/shared';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

// Rotas que ainda não têm tela nenhuma. As demais (notificações, calendário,
// sistemas, GM Tools, bestiário, tutoriais, créditos...) já existem, mesmo que
// sejam telas "Em breve", então abrem normalmente.
const ROTAS_PENDENTES: string[] = [];

// Sem o prefixo "/(tabs)": os grupos do expo-router não fazem parte da URL, então
// "/mesas" funciona esteja o arquivo dentro de (tabs) ou direto em app/.
// Ordem do menu: a mesma do Figma, com Fichas, Dados, Inventário e Livraria
// no começo por serem as telas mais usadas.
const MENU_ITEMS: { label: string; icon: string; route: string; color?: string }[] = [
  { label: 'Home Page', icon: 'home', route: '/mesas' },
  { label: 'Fichas', icon: 'account-details-outline', route: '/skills' },
  { label: 'Dados', icon: 'dice-multiple-outline', route: '/dados' },
  { label: 'Inventário', icon: 'treasure-chest', route: '/vault' },
  { label: 'Livraria', icon: 'book-open-variant', route: '/livraria' },
  { label: 'Busca', icon: 'magnify', route: '/explore' },
  { label: 'Notificações', icon: 'bell-outline', route: '/notificacoes' },
  { label: 'Comunidade', icon: 'account-group-outline', route: '/comunidade' },
  { label: 'Calendário', icon: 'calendar-month-outline', route: '/calendario' },
  { label: 'Sistemas', icon: 'book-open-page-variant-outline', route: '/sistemas' },
  { label: 'GM Tools', icon: 'magic-staff', route: '/gmtools' },
  { label: 'Bestiário', icon: 'paw', route: '/bestiario' },
  { label: 'Tutoriais', icon: 'message-processing-outline', route: '/tutoriais' },
  { label: 'Créditos', icon: 'dice-d20', route: '/creditos', color: COLORS.primary },
  { label: 'Configurações', icon: 'cog-outline', route: '/configuracoes' },
];

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  useAcessibilidade();
  const router = useRouter();

  const handleNavigation = (route: string) => {
    onClose();

    if (ROTAS_PENDENTES.includes(route)) {
      console.warn(`Rota "${route}" ainda não implementada.`);
      return;
    }

    router.push(route as any);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={[styles.drawerContainer, { backgroundColor: COLORS.surfaceContainerHigh }]}>
          <View style={styles.drawerHeader}>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Fechar menu">
              <MaterialCommunityIcons name="menu" size={32} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {MENU_ITEMS.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={28}
                  color={item.label === 'Créditos' ? COLORS.primary : COLORS.onSurfaceVariant}
                />
                <Text style={[styles.menuText, { color: item.label === 'Créditos' ? COLORS.primary : COLORS.onSurface }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: 'row' },
  backdrop: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  drawerContainer: {
    width: '75%', height: '100%',
    backgroundColor: COLORS.surfaceContainerHigh,
    paddingTop: 40, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 5,
  },
  drawerHeader: { paddingHorizontal: 20, paddingBottom: 20 },
  scrollContent: { paddingBottom: 40 },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 20,
  },
  menuText: {
    color: COLORS.onSurface, fontSize: appFontSize(18),
    fontFamily: 'SourceSerif4_700Bold', marginLeft: 16,
  },
});
