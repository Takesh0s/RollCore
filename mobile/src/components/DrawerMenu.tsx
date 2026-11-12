import { useRouter, usePathname } from 'expo-router';
import { Image, Modal, ScrollView, View, useWindowDimensions } from 'react-native';
import { AccessiblePressable as Pressable, AccessibleText as Text } from './accessible-text';
import { NavIcon, type NavIconName } from './NavIcon';
import { RollCoreLogo } from './RollCoreLogo';
import { COLORS, appFontSize } from '../design/shared';
import { imageSrc } from '../lib/mapImage';
import { useAcessibilidade } from '../store/acessibilidade';
import { encerrarSessao, useContaAtiva } from '../store/conta';
import { useNotifications } from '../store/useNotifications';
import { showToast } from '../store/useToast';

interface DrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

/** Sem `route`: o web ainda não tem a tela e mostra "chega em breve"; o app faz o mesmo. */
type Item = { label: string; icon: NavIconName; route?: string };

// O mesmo menu do web no celular (AppHeader.tsx), na mesma ordem. As rotas não levam o prefixo "/(tabs)": os grupos do expo-router não fazem parte da URL.
const ITEMS: Item[] = [
  { label: 'Notificações', icon: 'bell', route: '/notificacoes' },
  { label: 'Início', icon: 'home', route: '/inicio' },
  { label: 'Fichas', icon: 'sheets', route: '/skills' },
  { label: 'Dados', icon: 'dice', route: '/dados' },
  { label: 'Mesas', icon: 'tables', route: '/mesas' },
  { label: 'Calendário', icon: 'calendar', route: '/calendario' },
  { label: 'Comunidade', icon: 'community' },
  { label: 'Sistemas', icon: 'systems' },
  { label: 'Bestiário', icon: 'bestiary' },
  { label: 'GM Tools', icon: 'tools', route: '/mapas' },
  { label: 'Livraria', icon: 'store' },
  { label: 'Tutoriais', icon: 'tutorials' },
];
const SETTINGS: Item = { label: 'Configurações', icon: 'settings', route: '/tema' };

// Telas que pertencem a cada item (a ficha, o formulário de mesa etc. mantêm o item destacado).
const ALSO: Record<string, string[]> = {
  '/skills': ['/personagens', '/criar-personagem'],
  '/mesas': ['/mesa', '/sessao'],
  '/calendario': ['/evento', '/novo-evento'],
  '/mapas': ['/mapa-novo', '/mapa-editor', '/oficina-mapas'],
};
const isActive = (path: string, route?: string) => !!route && [route, ...(ALSO[route] ?? [])].some((r) => path === r || path.startsWith(`${r}/`));

const MUTED = '#C0C0C0';
const SERIF = 'SourceSerif4_700Bold';

/** Gaveta do menu, medida pelo CSS do web (mobile.css, `.side-menu.sheet`): cobre a tela inteira, da barra de status à de navegação. */
export default function DrawerMenu({ visible, onClose }: DrawerMenuProps) {
  const { tema } = useAcessibilidade();
  const router = useRouter();
  const path = usePathname();
  const conta = useContaAtiva();
  const unread = useNotifications((s) => s.unread);
  const { width } = useWindowDimensions();

  const go = (route?: string, label?: string) => { onClose(); if (route) router.push(route as any); else showToast(`${label} chega em breve.`); };
  const logout = async () => { onClose(); await encerrarSessao(); router.replace('/login'); };
  const avatar = imageSrc(conta?.avatarUrl);
  const name = conta?.apelido ?? '';
  const medieval = tema === 'medieval';

  const row = (item: Item) => {
    const active = isActive(path, item.route);
    const color = active ? COLORS.sapphire : MUTED;
    return (
      <Pressable key={item.label} onPress={() => go(item.route, item.label)} accessibilityRole="button" accessibilityState={{ selected: active }}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 16, minHeight: 48, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: active ? 'rgba(255,255,255,0.1)' : 'transparent' }}>
        {item.icon === 'dice'
          ? <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}><RollCoreLogo size={26} color={color} /></View>
          : <NavIcon name={item.icon} size={28} color={color} />}
        <Text style={{ flex: 1, color, fontFamily: SERIF, fontSize: appFontSize(16) }}>{item.label}</Text>
        {item.route === '/notificacoes' && unread > 0 && (
          <View accessibilityLabel={`${unread} não lidas`} style={{ minWidth: 22, height: 22, paddingHorizontal: 6, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.sapphire }}>
            <Text style={{ color: '#10202E', fontSize: appFontSize(12), fontFamily: 'Inter_700Bold' }}>{unread > 9 ? '9+' : unread}</Text>
          </View>
        )}
      </Pressable>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <View accessibilityViewIsModal style={{ width: Math.min(300, width * 0.82), height: '100%', backgroundColor: medieval ? '#3a454b' : COLORS.surfaceContainerHigh, borderRightWidth: 1, borderRightColor: 'rgba(192,192,192,0.35)' }}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 38, paddingHorizontal: 12, paddingBottom: 18 }} showsVerticalScrollIndicator={false}>
            <Pressable onPress={() => go('/perfil')} accessibilityRole="button" accessibilityLabel="Meu perfil"
              style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 8, paddingBottom: 16, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(192,192,192,0.55)' }}>
              {avatar
                ? <Image source={{ uri: avatar }} style={{ width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: 'rgba(192,192,192,0.85)' }} />
                : <NavIcon name="user" size={56} color={MUTED} />}
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={{ color: '#fff', fontFamily: SERIF, fontSize: appFontSize(17) }}>{name || 'Perfil'}</Text>
                <Text numberOfLines={1} style={{ color: '#9AA4A8', fontFamily: 'Inter_400Regular', fontSize: appFontSize(12) }}>{`@${(name || 'perfil').toLowerCase().replace(/\s+/g, '')}`}</Text>
              </View>
            </Pressable>
            <View style={{ gap: 2 }}>{ITEMS.map(row)}</View>
            <View style={{ marginTop: 'auto', paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(192,192,192,0.55)' }}>
              {row(SETTINGS)}
              <Pressable onPress={logout} accessibilityRole="button" style={{ marginTop: 4, marginLeft: 64, paddingVertical: 8, alignSelf: 'flex-start' }}>
                <Text style={{ color: '#e58a8a', fontFamily: SERIF, fontSize: appFontSize(13) }}>Sair da conta</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' }} onPress={onClose} accessibilityLabel="Fechar menu" />
      </View>
    </Modal>
  );
}
