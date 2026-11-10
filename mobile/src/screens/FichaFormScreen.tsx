import { MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AccessiblePressable as Pressable, AccessibleText as Text, AccessibleTextInput as TextInput } from '../components/accessible-text';
import { Avatar, ConfirmDialog, FormGroup, Select, StateBlock, inputStyle } from '../components/Controls';
import { COLORS, Header, appFontSize } from '../design/shared';
import { ATTR_KEYS, ATTR_LABELS, calcMod, formatMod, getRaceBonuses, profBonus } from '../lib/engine';
import { ATTR_INPUT_MAX, ATTR_INPUT_MIN, calcMaxHp, calcUnarmoredAC } from '../lib/engine-hp';
import { DEFAULT_SYSTEM, SYSTEMS, allSubclassOptions, getSystem } from '../lib/systems';
import { useAcessibilidade } from '../store/acessibilidade';
import { useCharacters } from '../store/useCharacters';
import { showToast } from '../store/useToast';
import type { AttrKey, Attributes } from '../types';
import { pickAvatarDataUrl } from '../utils/avatar';

const BODY = 'AtkinsonHyperlegible_400Regular';
const BOLD = 'AtkinsonHyperlegible_700Bold';
const SERIF = 'SourceSerif4_700Bold';

const EMPTY_ATTRS: Record<AttrKey, string> = { STR: '', DEX: '', CON: '', INT: '', WIS: '', CHA: '' };

/** Criar / editar ficha (mesmo fluxo do web: sistema, identidade, atributos base + bônus racial, PV e CA). */
export default function FichaFormScreen() {
  useAcessibilidade();
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { characters, loaded, load, add, update, remove } = useCharacters();
  const isEdit = !!id;
  const existing = characters.find((c) => c.id === id);

  const [system, setSystem] = useState(DEFAULT_SYSTEM);
  const [name, setName] = useState('');
  const [level, setLevel] = useState('');
  const [cls, setCls] = useState('');
  const [subclass, setSubclass] = useState('');
  const [race, setRace] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [attrs, setAttrs] = useState<Record<AttrKey, string>>(EMPTY_ATTRS);
  const [maxHp, setMaxHp] = useState('');
  const [ac, setAc] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [leaveAction, setLeaveAction] = useState<unknown>(null);

  // Foto instantânea do formulário: se mudar em relação à inicial, há alterações não salvas.
  const snapshot = JSON.stringify([system, name, level, cls, subclass, race, avatarUrl ?? '', attrs, maxHp, ac]);
  const [baseline, setBaseline] = useState<string | null>(isEdit ? null : snapshot);
  const dirty = baseline !== null && snapshot !== baseline && !saving;
  const dirtyRef = useRef(false);
  dirtyRef.current = dirty;

  useEffect(() => { if (isEdit && !loaded) void load(); }, [isEdit, loaded, load]);

  // Preenche ao editar
  useEffect(() => {
    if (!isEdit || !existing || baseline !== null) return;
    const filled: Record<AttrKey, string> = { ...EMPTY_ATTRS };
    // A ficha guarda o valor final (base + bônus racial), mas o formulário edita o valor BASE e soma o bônus ao salvar.
    const custom = !!getSystem(existing.game_system ?? DEFAULT_SYSTEM).custom;
    const bonus = custom ? {} : getRaceBonuses(existing.race);
    ATTR_KEYS.forEach((k) => { filled[k] = String(Math.max(ATTR_INPUT_MIN, existing.attributes[k] - (bonus[k] ?? 0))); });
    const vals = {
      system: existing.game_system ?? DEFAULT_SYSTEM, name: existing.name, level: String(existing.level), cls: existing.class,
      subclass: existing.subclass ?? '', race: existing.race, avatar: existing.avatar_url, maxHp: String(existing.max_hp ?? existing.hp), ac: String(existing.ac),
    };
    setSystem(vals.system); setName(vals.name); setLevel(vals.level); setCls(vals.cls); setSubclass(vals.subclass); setRace(vals.race);
    setAvatarUrl(vals.avatar); setAttrs(filled); setMaxHp(vals.maxHp); setAc(vals.ac);
    setBaseline(JSON.stringify([vals.system, vals.name, vals.level, vals.cls, vals.subclass, vals.race, vals.avatar ?? '', filled, vals.maxHp, vals.ac]));
  }, [isEdit, existing, baseline]);

  // Sair (voltar, gesto ou cabeçalho) com alterações não salvas pede confirmação
  useEffect(() => {
    const sub = (navigation as any).addListener('beforeRemove', (e: { preventDefault: () => void; data: { action: unknown } }) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      setLeaveAction(e.data.action);
    });
    return sub;
  }, [navigation]);

  const sys = getSystem(system);
  const isCustom = !!sys.custom;
  const raceBonuses = isCustom ? {} : getRaceBonuses(race);
  const subclassInfo = sys.subclasses[cls];
  const lvlNum = parseInt(level, 10);
  const showSubclass = isCustom || !!subclassInfo;
  const belowChoiceLevel = !!subclassInfo && !isCustom && (isNaN(lvlNum) || lvlNum < subclassInfo.choiceLevel);
  const subclassOptions = isCustom
    ? Array.from(new Set([...(subclassInfo?.options ?? []), ...allSubclassOptions()]))
    : (subclassInfo?.options ?? []);
  const disabledSystems = Object.fromEntries(SYSTEMS.filter((s) => !s.available).map((s) => [s.id, '(em breve)']));

  const clearErr = (k: string) => setErrors((p) => ({ ...p, [k]: '' }));

  function changeSystem(next: string) {
    const target = getSystem(next);
    setSystem(next);
    if (!target.custom) {
      if (cls && !target.classes.includes(cls)) { setCls(''); setSubclass(''); }
      if (race && !target.races.includes(race)) setRace('');
    }
  }

  function stepLevel(delta: number) {
    const cur = parseInt(level, 10);
    setLevel(String(Math.min(20, Math.max(1, (isNaN(cur) ? 0 : cur) + delta))));
    clearErr('level');
  }

  /** Preenche PV máx. e CA com as fórmulas do PHB (média por nível, sem armadura). */
  function autoCalc() {
    const lvl = parseInt(level, 10);
    const con = parseInt(attrs.CON, 10);
    if (!cls || isNaN(lvl) || lvl < 1 || lvl > 20) { showToast('Preencha Classe e Nível antes de calcular.', 'error'); return; }
    if (!isNaN(con) && con >= 1) {
      const hp = calcMaxHp(cls, lvl, con);
      if (hp === null) { showToast('Essa classe não tem fórmula automática — preencha HP e CA manualmente.', 'error'); return; }
      setMaxHp(String(hp));
    }
    const dex = parseInt(attrs.DEX, 10);
    if (!isNaN(dex)) {
      const snap: Attributes = {
        STR: parseInt(attrs.STR, 10) || 10, DEX: dex, CON: !isNaN(con) ? con : 10,
        INT: parseInt(attrs.INT, 10) || 10, WIS: parseInt(attrs.WIS, 10) || 10, CHA: parseInt(attrs.CHA, 10) || 10,
      };
      setAc(String(calcUnarmoredAC(cls, snap)));
    }
    showToast('HP e CA calculados automaticamente (sem armadura)', 'success');
  }

  function validate(): boolean {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Nome é obrigatório.';
    if (!cls) errs.cls = 'Classe é obrigatória.';
    if (!race) errs.race = 'Raça é obrigatória.';
    if (isNaN(lvlNum) || lvlNum < 1 || lvlNum > 20) errs.level = 'Nível deve ser entre 1 e 20.';
    ATTR_KEYS.forEach((k) => {
      const v = parseInt(attrs[k], 10);
      if (isNaN(v) || v < ATTR_INPUT_MIN || v > ATTR_INPUT_MAX) errs[k] = `${ATTR_INPUT_MIN}–${ATTR_INPUT_MAX}`;
    });
    const hp = parseInt(maxHp, 10);
    if (isNaN(hp) || hp < 1) errs.maxHp = 'HP Máximo deve ser ao menos 1.';
    const acVal = parseInt(ac, 10);
    if (isNaN(acVal) || acVal < 1) errs.ac = 'CA deve ser ao menos 1.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function save() {
    if (!validate()) { showToast('Confira os campos destacados.', 'error'); return; }
    setSaving(true);
    const final = {} as Attributes;
    ATTR_KEYS.forEach((k) => { final[k] = parseInt(attrs[k], 10) + (raceBonuses[k] ?? 0); });
    const hpMax = parseInt(maxHp, 10);
    const data = {
      game_system: system, name: name.trim(), class: cls, subclass: showSubclass ? subclass.trim() : '', race, level: lvlNum,
      attributes: final,
      // Editando, o PV atual não pode passar do novo máximo; criando, a ficha começa cheia
      hp: isEdit && existing ? Math.min(existing.hp, hpMax) : hpMax,
      max_hp: hpMax, temp_hp: isEdit && existing ? existing.temp_hp : 0, ac: parseInt(ac, 10),
      avatar_url: avatarUrl,
    };
    const res = isEdit && existing ? await update(existing.id, data) : await add(data);
    if (!res.ok) { setSaving(false); showToast(`Erro ao salvar personagem: ${res.error}`, 'error'); return; }
    showToast(isEdit ? 'Personagem atualizado!' : 'Personagem salvo com sucesso!', 'success');
    // `saving` mantém dirty=false durante a navegação, para o aviso de saída não aparecer
    if (isEdit) router.replace(`/personagens?id=${res.character.id}` as any);
    else router.replace('/skills');
  }

  async function doDelete() {
    if (!existing) return;
    setSaving(true);
    const res = await remove(existing.id);
    setShowDelete(false);
    if (!res.ok) { setSaving(false); showToast(`Erro ao excluir personagem: ${res.error}`, 'error'); return; }
    showToast('Personagem excluído.', 'success');
    router.replace('/skills');
  }

  async function changePhoto() {
    try {
      const url = await pickAvatarDataUrl();
      if (url) setAvatarUrl(url);
    } catch {
      showToast('Não foi possível usar essa imagem.', 'error');
    }
  }

  const back = () => (router.canGoBack() ? router.back() : router.replace('/skills'));

  if (isEdit && !existing) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
        <Header title="Editar ficha" onBack={back} />
        <StateBlock icon={loaded ? 'search-off' : 'hourglass-empty'} title={loaded ? 'Ficha não encontrada' : 'Carregando a ficha…'}
          actionLabel={loaded ? 'Voltar às fichas' : undefined} onAction={back} />
      </SafeAreaView>
    );
  }

  const section = (t: string) => <Text accessibilityRole="header" style={{ color: COLORS.primary, fontFamily: SERIF, fontSize: appFontSize(18), marginTop: 10 }}>{t}</Text>;

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: COLORS.background }}>
      <Header title={isEdit ? (existing?.name || 'Ficha') : 'Criar ficha'} onBack={back} rightIcon="save" onRightPress={save} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 8 }}>
            <Pressable onPress={changePhoto} accessibilityRole="button" accessibilityLabel="Escolher foto do personagem">
              <Avatar uri={avatarUrl} name={name} size={88} />
              <View style={{ position: 'absolute', right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary }}>
                <MaterialIcons name="photo-camera" size={16} color={COLORS.onPrimary} />
              </View>
            </Pressable>
            <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>Foto do personagem (opcional)</Text>
            {avatarUrl ? (
              <Pressable onPress={() => setAvatarUrl('')}><Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(12) }}>Remover foto</Text></Pressable>
            ) : null}
          </View>

          {section('Identidade')}
          <FormGroup label="Sistema" hint={isCustom ? 'Personalizado oferece as classes, raças e subclasses de todos os sistemas e aceita nomes digitados por você. Bônus raciais não são aplicados automaticamente.' : undefined}>
            <Select title="Sistema" value={system} options={SYSTEMS.map((s) => s.id)} disabledOptions={disabledSystems} onChange={changeSystem} />
          </FormGroup>
          <FormGroup label="Nome do personagem" error={errors.name}>
            <TextInput value={name} onChangeText={(t) => { setName(t); clearErr('name'); }} maxLength={100} placeholder="Ex: Aragorn"
              placeholderTextColor={COLORS.onSurfaceVariant} style={inputStyle(!!errors.name, !!name.trim())} />
          </FormGroup>
          <FormGroup label="Raça" error={errors.race}>
            <Select title="Raça" value={race} options={sys.races} custom={isCustom} error={!!errors.race} onChange={(v) => { setRace(v); clearErr('race'); }} />
          </FormGroup>
          <FormGroup label="Classe" error={errors.cls}>
            <Select title="Classe" value={cls} options={sys.classes} custom={isCustom} error={!!errors.cls}
              onChange={(v) => { setCls(v); if (!isCustom) setSubclass(''); clearErr('cls'); }} />
          </FormGroup>
          <FormGroup label="Subclasse" hint={belowChoiceLevel ? `Normalmente escolhida a partir do nível ${subclassInfo!.choiceLevel}.` : undefined}>
            <Select title="Subclasse" value={subclass} options={subclassOptions} custom={isCustom} disabled={!showSubclass} allowClear
              placeholder={showSubclass ? 'Selecione (opcional)' : '—'} onChange={setSubclass} />
          </FormGroup>

          {!!race && Object.keys(raceBonuses).length > 0 && (
            <View style={{ padding: 12, borderRadius: 10, backgroundColor: COLORS.primaryContainer, borderWidth: 1, borderColor: COLORS.primary }}>
              <Text style={{ color: COLORS.onPrimaryContainer, fontFamily: BODY, fontSize: appFontSize(13) }}>
                <Text style={{ fontFamily: BOLD }}>{race}: </Text>
                {Object.entries(raceBonuses).map(([k, v]) => `${ATTR_LABELS[k as AttrKey]} +${v}`).join(', ')} — aplicados automaticamente ao salvar.
              </Text>
            </View>
          )}

          <FormGroup label="Nível" error={errors.level} hint={`Bônus de proficiência: ${!isNaN(lvlNum) && lvlNum >= 1 && lvlNum <= 20 ? `+${profBonus(lvlNum)}` : '—'}`}>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <Pressable onPress={() => stepLevel(-1)} accessibilityLabel="Diminuir nível" style={{ width: 52, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                <MaterialIcons name="remove" size={22} color={COLORS.onSurface} />
              </Pressable>
              <TextInput value={level} onChangeText={(t) => { setLevel(t.replace(/\D/g, '')); clearErr('level'); }} keyboardType="number-pad" maxLength={2} placeholder="1–20"
                placeholderTextColor={COLORS.onSurfaceVariant} accessibilityLabel="Nível" style={[inputStyle(!!errors.level, !!level), { flex: 1, textAlign: 'center' }]} />
              <Pressable onPress={() => stepLevel(1)} accessibilityLabel="Aumentar nível" style={{ width: 52, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
                <MaterialIcons name="add" size={22} color={COLORS.onSurface} />
              </Pressable>
            </View>
          </FormGroup>

          {section('Atributos')}
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>
            {isCustom ? 'Digite o valor final de cada atributo (1–20).' : 'Digite o valor base (1–20). Bônus raciais são aplicados automaticamente ao salvar.'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' }}>
            {ATTR_KEYS.map((k) => {
              const num = parseInt(attrs[k], 10);
              const mod = !isNaN(num) && num >= ATTR_INPUT_MIN && num <= ATTR_INPUT_MAX ? formatMod(calcMod(num)) : '—';
              const bonus = raceBonuses[k];
              return (
                <View key={k} style={{ width: '30%', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BOLD, fontSize: appFontSize(12) }}>{ATTR_LABELS[k]}</Text>
                  <TextInput value={attrs[k]} onChangeText={(t) => { setAttrs((p) => ({ ...p, [k]: t.replace(/\D/g, '') })); clearErr(k); }}
                    keyboardType="number-pad" maxLength={2} placeholder="1–20" placeholderTextColor={COLORS.onSurfaceVariant} accessibilityLabel={`Atributo ${ATTR_LABELS[k]}`}
                    style={[inputStyle(!!errors[k], !!attrs[k] && !errors[k]), { width: '100%', textAlign: 'center' }]} />
                  <Text style={{ color: COLORS.primary, fontFamily: BOLD, fontSize: appFontSize(13) }}>{mod}</Text>
                  {bonus ? <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(11) }}>+{bonus} racial</Text> : null}
                  {errors[k] ? <Text style={{ color: '#e57373', fontFamily: BODY, fontSize: appFontSize(11) }}>{errors[k]}</Text> : null}
                </View>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
            {section('Combate')}
            <Pressable onPress={autoCalc} accessibilityLabel="Calcular HP e CA automaticamente"
              style={{ paddingHorizontal: 12, minHeight: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(12) }}>⚡ Calcular automaticamente</Text>
            </Pressable>
          </View>
          <Text style={{ color: COLORS.onSurfaceVariant, fontFamily: BODY, fontSize: appFontSize(12) }}>
            HP usa a média por nível (PHB p.15). CA assume sem armadura — ajuste manualmente se necessário.
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <FormGroup label="HP máximo" error={errors.maxHp}>
                <TextInput value={maxHp} onChangeText={(t) => { setMaxHp(t.replace(/\D/g, '')); clearErr('maxHp'); }} keyboardType="number-pad" placeholder="Ex: 12"
                  placeholderTextColor={COLORS.onSurfaceVariant} style={[inputStyle(!!errors.maxHp, !!maxHp), { textAlign: 'center' }]} />
              </FormGroup>
            </View>
            <View style={{ flex: 1 }}>
              <FormGroup label="Classe de armadura" error={errors.ac}>
                <TextInput value={ac} onChangeText={(t) => { setAc(t.replace(/\D/g, '')); clearErr('ac'); }} keyboardType="number-pad" placeholder="Ex: 14"
                  placeholderTextColor={COLORS.onSurfaceVariant} style={[inputStyle(!!errors.ac, !!ac), { textAlign: 'center' }]} />
              </FormGroup>
            </View>
          </View>

          <View style={{ gap: 10, marginTop: 10 }}>
            <Pressable onPress={save} disabled={saving} accessibilityRole="button"
              style={{ minHeight: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.primary, opacity: saving ? 0.6 : 1 }}>
              <Text style={{ color: COLORS.onPrimary, fontFamily: BOLD, fontSize: appFontSize(16) }}>{saving ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar personagem'}</Text>
            </Pressable>
            <Pressable onPress={back} disabled={saving} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.outlineVariant }}>
              <Text style={{ color: COLORS.onSurface, fontFamily: BOLD, fontSize: appFontSize(15) }}>Cancelar</Text>
            </Pressable>
            {isEdit && (
              <Pressable onPress={() => setShowDelete(true)} disabled={saving} style={{ minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c0392b' }}>
                <Text style={{ color: '#fff', fontFamily: BOLD, fontSize: appFontSize(15) }}>Excluir ficha</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <ConfirmDialog visible={showDelete} danger busy={saving} title="Excluir personagem" message="Tem certeza? Esta ação não pode ser desfeita."
        confirmLabel="Excluir" onConfirm={doDelete} onCancel={() => setShowDelete(false)} />
      <ConfirmDialog visible={leaveAction !== null} title="Descartar alterações?" message={`Você ${isEdit ? 'editou' : 'começou a criar'} ${name.trim() || 'a ficha'} e ainda não salvou.`}
        confirmLabel="Descartar" cancelLabel="Continuar editando" danger
        onConfirm={() => { const a = leaveAction; setLeaveAction(null); dirtyRef.current = false; (navigation as any).dispatch(a); }}
        onCancel={() => setLeaveAction(null)} />
    </SafeAreaView>
  );
}
