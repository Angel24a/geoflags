import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Flag } from '@/components/Flag';
import { Chip, Icon, Row, Segmented, T } from '@/components/ui';
import {
  CATEGORY_ORDER, CATEGORY_SHORT, COLOR_HEX, COLOR_LABEL, COLOR_ORDER, CONTINENT_LABEL, CONTINENT_ORDER, ENTITIES, LANGUAGES,
  type Category, type ColorKey, type Continent, type Entity, type Language,
} from '@/data';
import { formatSpeakers, langKey } from '@/lib/languages';
import { normalize } from '@/lib/text';
import { masteryLevel, useApp } from '@/state/app-state';
import { MAX_WIDTH, radius, space, useTheme, noOutline } from '@/theme';

const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter(y => y !== x) : [...list, x]);

type Section = 'flags' | 'languages';

export default function Glossary() {
  const c = useTheme();
  const params = useLocalSearchParams<{ tab?: Section }>();
  const [section, setSection] = useState<Section>(params.tab === 'languages' ? 'languages' : 'flags');
  useEffect(() => {
    if (params.tab) setSection(params.tab);
  }, [params.tab]);
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.header, { paddingBottom: 0 }]}>
        <T variant="title">Glosario</T>
        <View style={{ marginTop: space.md }}>
          <Segmented
            options={[{ key: 'flags', label: `Banderas (${ENTITIES.length})` }, { key: 'languages', label: `Idiomas (${LANGUAGES.length})` }]}
            value={section}
            onChange={setSection}
          />
        </View>
      </View>
      {section === 'flags' ? <FlagsList /> : <LanguagesList />}
    </SafeAreaView>
  );
}

function SearchBox({ value, onChange, placeholder }: { value: string; onChange: (s: string) => void; placeholder: string }) {
  const c = useTheme();
  return (
    <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
      <Icon name="search" size={18} color={c.textSecondary} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.textSecondary}
        style={[{ flex: 1, color: c.text, fontSize: 16, paddingVertical: 10 }, noOutline]}
        autoCorrect={false}
      />
      {!!value && (
        <Pressable onPress={() => onChange('')}>
          <Icon name="close" size={18} color={c.textSecondary} />
        </Pressable>
      )}
    </View>
  );
}

const FAMILIES = [...new Set(LANGUAGES.map(l => l.family))].sort((a, b) => a.localeCompare(b, 'es'));

function LanguagesList() {
  const c = useTheme();
  const { stats } = useApp();
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<string | null>(null);
  const MASTERY_COLOR = ['transparent', c.warning, c.accent, c.success];

  const list = useMemo(() => {
    const q = normalize(query);
    return LANGUAGES.filter(
      l => (!family || l.family === family) && (!q || [l.name, l.native, ...(l.aliases ?? []), l.family, l.branch ?? ''].some(n => normalize(n).includes(q))),
    );
  }, [query, family]);

  const renderItem = ({ item: l }: { item: Language }) => {
    const m = masteryLevel(stats[langKey(l.id)]);
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/language/[id]', params: { id: l.id } })}
        style={({ pressed }) => [styles.langRow, { backgroundColor: c.surface, borderColor: c.border, opacity: pressed ? 0.6 : 1 }]}
      >
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6}>
            {m > 0 && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: MASTERY_COLOR[m] }} />}
            <T variant="label">{l.name}</T>
            <T variant="caption" muted numberOfLines={1} style={{ flex: 1 }}>{l.native}</T>
          </Row>
          <T variant="caption" muted numberOfLines={1}>{l.branch ? `${l.family} · ${l.branch}` : l.family} · {formatSpeakers(l.speakers)}</T>
        </View>
        <Row gap={3}>
          {l.countries.slice(0, 3).map(id => <Flag key={id} id={id} height={16} normalized />)}
        </Row>
      </Pressable>
    );
  };

  return (
    <>
      <View style={styles.header}>
        <SearchBox value={query} onChange={setQuery} placeholder="Buscar idioma o familia" />
        <ScrollRow>
          <Chip label="Todas" selected={!family} onPress={() => setFamily(null)} />
          {FAMILIES.map(f => <Chip key={f} label={f} selected={family === f} onPress={() => setFamily(family === f ? null : f)} />)}
        </ScrollRow>
        <T variant="caption" muted style={{ marginTop: space.sm }}>{list.length} idiomas</T>
      </View>
      <FlatList
        data={list}
        keyExtractor={l => l.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, { gap: space.sm }]}
        initialNumToRender={14}
        keyboardShouldPersistTaps="handled"
      />
    </>
  );
}

function ScrollRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: space.md, flexGrow: 0 }} contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
      {children}
    </ScrollView>
  );
}

function FlagsList() {
  const c = useTheme();
  const { stats } = useApp();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [cats, setCats] = useState<Category[]>([]);
  const [conts, setConts] = useState<Continent[]>([]);
  const [colors, setColors] = useState<ColorKey[]>([]);

  const list = useMemo(() => {
    const q = normalize(query);
    return ENTITIES.filter(
      e =>
        (!cats.length || cats.includes(e.category)) &&
        (!conts.length || conts.includes(e.continent)) &&
        colors.every(col => e.colors.includes(col)) &&
        (!q || [e.name, ...e.aliases, e.capital ?? ''].some(n => normalize(n).includes(q))),
    );
  }, [query, cats, conts, colors]);

  const activeFilters = cats.length + conts.length + colors.length;
  const MASTERY_COLOR = ['transparent', c.warning, c.accent, c.success];

  const renderItem = ({ item }: { item: Entity }) => {
    const m = masteryLevel(stats[item.id]);
    return (
      <Pressable onPress={() => router.push({ pathname: '/glossary/[id]', params: { id: item.id } })} style={({ pressed }) => [styles.cell, { opacity: pressed ? 0.6 : 1 }]}>
        <View style={[styles.flagBox, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Flag id={item.id} width={130} height={78} />
        </View>
        <Row gap={6} style={{ marginTop: 6 }}>
          {m > 0 && <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: MASTERY_COLOR[m] }} />}
          <T variant="caption" numberOfLines={1} style={{ flex: 1, fontWeight: '500' }}>{item.name}</T>
        </Row>
      </Pressable>
    );
  };

  return (
    <>
      <View style={styles.header}>
        <Row>
          <SearchBox value={query} onChange={setQuery} placeholder="Buscar país, territorio o capital" />
          <Pressable
            onPress={() => setShowFilters(s => !s)}
            style={[styles.filterBtn, { backgroundColor: activeFilters ? c.accentSoft : c.surface, borderColor: activeFilters ? c.accent : c.border }]}
          >
            <Icon name="filter" size={18} color={activeFilters ? c.accent : c.text} />
          </Pressable>
        </Row>
        {showFilters && (
          <View style={{ gap: space.sm, marginTop: space.md }}>
            <Row wrap gap={6}>
              {CATEGORY_ORDER.map(k => <Chip key={k} label={CATEGORY_SHORT[k]} selected={cats.includes(k)} onPress={() => setCats(toggle(cats, k))} />)}
            </Row>
            <Row wrap gap={6}>
              {CONTINENT_ORDER.map(k => <Chip key={k} label={CONTINENT_LABEL[k]} selected={conts.includes(k)} onPress={() => setConts(toggle(conts, k))} />)}
            </Row>
            <Row wrap gap={6}>
              {COLOR_ORDER.map(k => <Chip key={k} label={COLOR_LABEL[k]} color={COLOR_HEX[k]} selected={colors.includes(k)} onPress={() => setColors(toggle(colors, k))} />)}
            </Row>
            {activeFilters > 0 && (
              <Pressable onPress={() => { setCats([]); setConts([]); setColors([]); }}>
                <T variant="caption" color={c.accent} style={{ fontWeight: '600' }}>Quitar filtros</T>
              </Pressable>
            )}
          </View>
        )}
        <T variant="caption" muted style={{ marginTop: space.sm }}>{list.length} banderas</T>
      </View>
      <FlatList
        data={list}
        keyExtractor={e => e.id}
        renderItem={renderItem}
        numColumns={2}
        columnWrapperStyle={{ gap: space.md }}
        contentContainerStyle={styles.list}
        initialNumToRender={12}
        windowSize={7}
        keyboardShouldPersistTaps="handled"
      />
    </>
  );
}

const styles = StyleSheet.create({
  header: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg, paddingTop: space.lg, paddingBottom: space.sm },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: space.sm, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.md, paddingHorizontal: space.md },
  filterBtn: { width: 44, height: 44, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  list: { width: '100%', maxWidth: MAX_WIDTH, alignSelf: 'center', paddingHorizontal: space.lg, paddingBottom: space.xxl, gap: space.lg },
  cell: { flex: 1 },
  langRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  flagBox: { height: 100, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
});
