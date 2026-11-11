import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text } from './accessible-text';
import { Avatar } from './Controls';
import { COLORS, appFontSize } from '../design/shared';
import { imageSrc } from '../lib/mapImage';
import { encerrarSessao, useContaAtiva } from '../store/conta';
import { useNotifications } from '../store/useNotifications';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

type Item = { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; route: string };

// O mesmo menu do web, na mesma ordem. As rotas não levam o prefixo "/(tabs)": os grupos do expo-router não fazem parte da URL.
const ITEMS: Item[] = [
  { label: 'Notificações', icon: 'bell-outline', route: '/notificacoes' },
  { label: 'Início', icon: 'home-outline', route: '/inicio' },
  { label: 'Fichas', icon: 'script-text-outline', route: '/skills' },
  { label: 'Dados', icon: 'dice-d20-outline', route: '/dados' },
  { label: 'Mesas', icon: 'account-group-outline', route: '/mesas' },
  { label: 'Calendário', icon: 'calendar-month-outline', route: '/calendario' },
  { label: 'Comunidade', icon: 'graph-outline', route: '/comunidade' },
  { label: 'Sistemas', icon: 'bookshelf', route: '/sistemas' },
  { label: 'Bestiário', icon: 'paw', route: '/bestiario' },
  { label: 'GM Tools', icon: 'auto-fix', route: '/mapas' },
  { label: 'Livraria', icon: 'cart-outline', route: '/livraria' },
  { label: 'Tutoriais', icon: 'book-open-variant', route: '/tutoriais' },
];
const SETTINGS: Item = { label: 'Configurações', icon: 'cog-outline', route: '/configuracoes' };

// Telas que pertencem a cada item (a ficha, o formulário de mesa etc. mantêm o item destacado).
const ALSO: Record<string, string[]> = {
  '/skills': ['/personagens', '/criar-personagem'],
  '/mesas': ['/mesa', '/sessao', '/campanha'],
  '/calendario': ['/evento', '/novo-evento'],
  '/mapas': ['/mapa-novo', '/mapa-editor', '/oficina-mapas'],
  '/configuracoes': ['/tema', '/acessibilidade-visual'],
};
const isActive = (path: string, route: string) => [route, ...(ALSO[route] ?? [])].some((r) => path === r || path.startsWith(`${r}/`));

export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  useAcessibilidade();
  const router = useRouter();
  const path = usePathname();
  const conta = useContaAtiva();
  const unread = useNotifications((s) => s.unread);

  const go = (route: string) => { onClose(); router.push(route as any); };
  const logout = async () => { onClose(); await encerrarSessao(); router.replace('/login'); };

  const row = (item: Item) => {
    const active = isActive(path, item.route);
    return (
      <Pressable key={item.label} onPress={() => go(item.route)} accessibilityRole="button" accessibilityState={{ selected: active }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 50, paddingHorizontal: 14, borderRadius: 14, backgroundColor: active ? 'rgba(255,255,255,0.08)' : 'transparent' }}>
        <MaterialCommunityIcons name={item.icon} size={28} color={active ? COLORS.sapphire : COLORS.onSurfaceVariant} />
        <Text style={{ flex: 1, color: active ? COLORS.sapphire : COLORS.onSurfaceVariant, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(16) }}>{item.label}</Text>
        {item.route === '/notificacoes' && unread > 0 && (
          <View accessibilityLabel={`${unread} não lidas`} style={{ minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.sapphire }}>
            <Text style={{ color: '#10202E', fontSize: appFontSize(12), fontFamily: 'AtkinsonHyperlegible_700Bold' }}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </Pressable>
    );
  };
  const line = <View style={{ height: 1, marginVertical: 10, backgroundColor: COLORS.outlineVariant }} />;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View accessibilityViewIsModal style={{ width: '78%', maxWidth: 340, height: '100%', backgroundColor: COLORS.surfaceContainerHigh }}>
          <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8, paddingVertical: 8 }}>
                <Avatar uri={imageSrc(conta?.avatarUrl)} name={conta?.apelido ?? '?'} size={56} />
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(17) }}>{conta?.apelido ?? ''}</Text>
                  {!!conta?.apelido && <Text numberOfLines={1} style={{ color: COLORS.outline, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(13) }}>{`@${conta.apelido.toLowerCase()}`}</Text>}
                </View>
              </View>
              {line}
              {ITEMS.map(row)}
              {line}
              {row(SETTINGS)}
              <Pressable onPress={logout} accessibilityRole="button" style={{ alignSelf: 'center', minHeight: 44, justifyContent: 'center', marginTop: 4 }}>
                <Text style={{ color: '#e58a8a', fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(14) }}>Sair da conta</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </View>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' }} onPress={onClose} accessibilityLabel="Fechar menu" />
      </View>
    </Modal>
  );
}
