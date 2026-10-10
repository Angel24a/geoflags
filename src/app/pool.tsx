import { router } from 'expo-router';
import { View } from 'react-native';

import { Button, Chip, Row, Screen, SectionTitle, T } from '@/components/ui';
import { CATEGORY_LABEL, CATEGORY_ORDER, CONTINENT_LABEL, CONTINENT_ORDER, ENTITIES, type Category, type Continent } from '@/data';
import { filterPool, inPool, presetOf, PRESETS, type PoolFilter } from '@/lib/pool';
import { useApp } from '@/state/app-state';
import { space } from '@/theme';

const toggle = <T,>(list: T[], x: T) => (list.includes(x) ? list.filter(y => y !== x) : [...list, x]);

export default function PoolScreen() {
  const { settings, updateSettings } = useApp();
  const f = settings.pool;
  const set = (pool: PoolFilter) => updateSettings({ pool });
  const active = presetOf(f);
  const count = filterPool(f).length;

  const countFor = (patch: Partial<PoolFilter>) => ENTITIES.filter(e => inPool(e, { ...f, ...patch })).length;

  return (
    <Screen edges={[]}>
      <SectionTitle>Rápido</SectionTitle>
      <Row wrap>
        {PRESETS.map(p => (
          <Chip key={p.key} label={p.label} selected={active?.key === p.key} onPress={() => set(p.filter)} />
        ))}
      </Row>

      <SectionTitle>Tipo</SectionTitle>
      <Row wrap>
        <Chip label="Las 254 base" selected={!!f.baseOnly} onPress={() => set({ ...f, baseOnly: !f.baseOnly })} />
        {CATEGORY_ORDER.map((cat: Category) => (
          <Chip
            key={cat}
            label={`${CATEGORY_LABEL[cat]} (${ENTITIES.filter(e => e.category === cat).length})`}
            selected={f.categories.includes(cat)}
            onPress={() => set({ ...f, categories: toggle(f.categories, cat) })}
          />
        ))}
      </Row>
      <T variant="caption" muted style={{ marginTop: space.sm }}>Sin seleccionar = todos los tipos.</T>

      <SectionTitle>Continente</SectionTitle>
      <Row wrap>
        {CONTINENT_ORDER.map((ct: Continent) => (
          <Chip
            key={ct}
            label={`${CONTINENT_LABEL[ct]} (${countFor({ continents: [ct] })})`}
            selected={f.continents.includes(ct)}
            onPress={() => set({ ...f, continents: toggle(f.continents, ct) })}
          />
        ))}
      </Row>
      <T variant="caption" muted style={{ marginTop: space.sm }}>Sin seleccionar = todo el mundo.</T>

      <View style={{ flex: 1 }} />
      <View style={{ marginTop: space.xl, gap: space.sm }}>
        <T center muted>{count} banderas seleccionadas</T>
        <Button title="Listo" disabled={count < 4} onPress={() => router.back()} />
        {count < 4 && <T center variant="caption" muted>Selecciona al menos 4 banderas.</T>}
      </View>
    </Screen>
  );
}
