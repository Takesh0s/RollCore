import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS } from '../design/shared';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

const ROTAS_PENDENTES = [
  '/notificacoes',
  '/comunidade',
  '/calendario',
  '/sistemas',
  '/gmtools',
  '/bestiario',
  '/tutoriais',
  '/creditos',
  '/busca',
];

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const router = useRouter();

  const handleNavigation = (route: string) => {
    onClose();

    if (ROTAS_PENDENTES.includes(route)) {
      console.warn(`Rota "${route}" ainda não implementada.`);
      return;
    }

    router.push(route as any);
  };

  const menuItems = [
    { label: 'Home Page', icon: 'home', route: '/(tabs)/mesas' },
    { label: 'Minhas Mesas', icon: 'flag-outline', route: '/(tabs)/mesas' },
    { label: 'Personagens', icon: 'account-details-outline', route: '/(tabs)/skills' },
    { label: 'Busca', icon: 'magnify', route: '/busca' },
    { label: 'Livraria', icon: 'book-open-variant', route: '/(tabs)/livraria' },
    { label: 'Notificações', icon: 'bell-outline', route: '/notificacoes' },
    { label: 'Comunidade', icon: 'account-group-outline', route: '/comunidade' },
    { label: 'Calendario', icon: 'calendar-month-outline', route: '/calendario' },
    { label: 'Sistemas', icon: 'book-open-page-variant-outline', route: '/sistemas' },
    { label: 'Gm Tools', icon: 'magic-staff', route: '/gmtools' },
    { label: 'Bestiario', icon: 'paw', route: '/bestiario' },
    { label: 'Tutoriais', icon: 'message-processing-outline', route: '/tutoriais' },
    { label: 'Creditos', icon: 'dice-d20', route: '/creditos', color: COLORS.primary },
  ];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

        <View style={styles.drawerContainer}>
          <View style={styles.drawerHeader}>
            <TouchableOpacity onPress={onClose}>
              <MaterialCommunityIcons name="menu" size={32} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                onPress={() => handleNavigation(item.route)}
              >
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={28}
                  color={item.color || COLORS.onSurfaceVariant}
                />
                <Text style={[
                  styles.menuText,
                  item.color && { color: item.color }
                ]}>
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
    color: COLORS.onSurface, fontSize: 18,
    fontFamily: 'SourceSerif4_700Bold', marginLeft: 16,
    textTransform: 'capitalize',
  },
});