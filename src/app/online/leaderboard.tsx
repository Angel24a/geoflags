import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';

import { Board, OnlineGate } from '@/components/online';
import { Chip, Row, Screen, SectionTitle, T } from '@/components/ui';
import { leaderboard, type BoardRow } from '@/lib/online/api';
import { PRESETS } from '@/lib/pool';
import { RULE_LABEL } from '@/lib/quiz';
import { space, useTheme } from '@/theme';

const RULES = ['survival', 'timed', 'streak'] as const;

const COMBOS: { key: string; label: string }[] = [
  { key: 'flag>name:choice', label: 'Bandera → Nombre' },
  { key: 'name>flag:choice', label: 'Nombre → Bandera' },
  { key: 'flag>capital:choice', label: 'Bandera → Capital' },
  { key: 'shape>name:choice', label: 'Forma → Nombre' },
  { key: 'flag>map:map', label: 'Bandera → Mapa' },
  { key: 'capital>map:map', label: 'Capital → Mapa' },
  { key: 'flag>name:type', label: 'Bandera → Escribir' },
];

export default function Leaderboard() {
  const c = useTheme();
  const [rule, setRule] = useState<(typeof RULES)[number]>('survival');
  const [combo, setCombo] = useState(COMBOS[0].key);
  const [pool, setPool] = useState('all');
  const [rows, setRows] = useState<BoardRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    setError(null);
    leaderboard(`${rule}:${combo}:${pool}`)
      .then(setRows)
      .catch(e => {
        setRows([]);
        setError((e as Error).message);
      });
  }, [rule, combo, pool]);

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Clasificación' }} />
      <OnlineGate>
        <T variant="caption" muted style={{ marginTop: space.sm }}>
          Tus mejores marcas en los desafíos se suben solas. Juega desde Jugar → Desafíos con el mismo tipo de test y banderas.
        </T>
        <SectionTitle>Desafío</SectionTitle>
        <Row wrap gap={6}>
          {RULES.map(r => <Chip key={r} label={RULE_LABEL[r]} selected={rule === r} onPress={() => setRule(r)} />)}
        </Row>
        <SectionTitle>Test</SectionTitle>
        <Row wrap gap={6}>
          {COMBOS.map(x => <Chip key={x.key} label={x.label} selected={combo === x.key} onPress={() => setCombo(x.key)} />)}
        </Row>
        <SectionTitle>Banderas</SectionTitle>
        <Row wrap gap={6}>
          {PRESETS.map(p => <Chip key={p.key} label={p.label} selected={pool === p.key} onPress={() => setPool(p.key)} />)}
        </Row>
        <SectionTitle>Ranking</SectionTitle>
        <Board rows={rows} />
        {error && <T variant="caption" color={c.error}>{error}</T>}
      </OnlineGate>
    </Screen>
  );
}
