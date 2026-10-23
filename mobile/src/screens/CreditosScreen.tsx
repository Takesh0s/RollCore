import { useAcessibilidade } from '../store/acessibilidade';
import { MaterialIcons } from '@expo/vector-icons';
import { ScrollView, Text as NativeText, View } from 'react-native';
import { AccessibleText as Text } from '../components/accessible-text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../components/AppHeader';
import { COLORS, useAppFonts, appFontSize } from '../design/shared';

const TECH = [
  { name: 'Expo', detail: 'Plataforma de desenvolvimento do app', icon: 'apps' as const },
  { name: 'React Native', detail: 'Interface para Android, iOS e Web', icon: 'devices' as const },
  { name: 'TypeScript', detail: 'Tipagem e estrutura do código', icon: 'code' as const },
  { name: 'Expo Router', detail: 'Navegação baseada em arquivos', icon: 'alt-route' as const },
];

function InfoCard({ title, children, icon }: { title: string; children: React.ReactNode; icon: keyof typeof MaterialIcons.glyphMap }) {
  return (
    <View style={{ padding: 16, gap: 12, borderRadius: 14, backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 1, borderColor: COLORS.outlineVariant }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <MaterialIcons name={icon} size={21} color={COLORS.primary} />
        <Text style={{ color: COLORS.onSurface, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(18) }}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

export default function CreditosScreen() {
  useAcessibilidade();
  const fontsLoaded = useAppFonts();
  if (!fontsLoaded) return null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background }}>
      <AppHeader title="Créditos" />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 14 }}>
        <View style={{ alignItems: 'center', paddingVertical: 22, gap: 10 }}>
          <View style={{ width: 82, height: 82, borderRadius: 41, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerHigh, borderWidth: 2, borderColor: 'rgba(192,192,192,0.45)' }}>
            <MaterialIcons name="casino" size={42} color={COLORS.primary} />
          </View>
          <Text style={{ color: COLORS.primary, fontFamily: 'SourceSerif4_700Bold', fontSize: appFontSize(28) }}>RollCore</Text>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14) }}>Seu espaço para criar e viver aventuras de RPG.</Text>
          <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16, backgroundColor: COLORS.surfaceContainerHighest }}>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(12) }}>Versão 1.0.0</Text>
          </View>
        </View>

        <InfoCard title="Sobre o projeto" icon="auto-awesome">
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), lineHeight: 21 }}>
            RollCore reúne ferramentas para apoiar campanhas de RPG: fichas, mesas, rolagens, inventário, comunidade e recursos para mestres. Este projeto está em desenvolvimento.
          </Text>
        </InfoCard>

        <InfoCard title="Tecnologias" icon="code">
          <View style={{ gap: 12 }}>
            {TECH.map((technology) => (
              <View key={technology.name} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.surfaceContainerLowest }}>
                  <MaterialIcons name={technology.icon} size={19} color={COLORS.primary} />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: COLORS.onSurface, fontFamily: 'AtkinsonHyperlegible_700Bold', fontSize: appFontSize(14) }}>{technology.name}</Text>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(12) }}>{technology.detail}</Text>
                </View>
              </View>
            ))}
          </View>
        </InfoCard>

        <InfoCard title="Autoria e créditos" icon="groups">
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(14), lineHeight: 21 }}>
            Os nomes de colaboradores, autores de conteúdo e licenças de recursos serão informados aqui quando os dados e as autorizações correspondentes forem definidos pelo projeto.
          </Text>
        </InfoCard>

        <Text style={{ paddingHorizontal: 8, paddingTop: 4, color: COLORS.outline, fontFamily: 'AtkinsonHyperlegible_400Regular', fontSize: appFontSize(11), lineHeight: 16, textAlign: 'center' }}>
          RollCore é um projeto independente. Marcas, sistemas e obras citados pertencem aos seus respectivos titulares.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
