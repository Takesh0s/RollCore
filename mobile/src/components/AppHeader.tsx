import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Header } from '../design/shared';
import DrawerMenu from './DrawerMenu';

// Cabeçalho padrão do Figma: hambúrguer, título e ícone de perfil. Já traz o
// menu lateral dentro, então cada tela só precisa de:
//
//   <AppHeader title="Mesas" />
//
// O ícone de perfil abre a tela de Perfil; Configurações permanece no menu.
export function AppHeader({
  title,
  rightIcon = 'person',
  onRightPress,
}: {
  title: string;
  rightIcon?: keyof typeof MaterialIcons.glyphMap;
  onRightPress?: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <Header
        title={title}
        onMenu={() => setMenuOpen(true)}
        rightIcon={rightIcon}
        onRightPress={onRightPress ?? (() => router.push('/perfil' as any))}
      />
      <DrawerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

export default AppHeader;
