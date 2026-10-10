import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button, Card, Chip, Row, Screen, SectionTitle, Segmented, T } from '@/components/ui';
import {
  ANSWER_ATTRS, ATTR_LABEL, eligibleFor, inputsFor, PROMPT_ATTRS, RULE_HELP, RULE_LABEL,
  type Attr, type InputMode, type Rule,
} from '@/lib/quiz';
import { describePool } from '@/lib/pool';
import { useApp } from '@/state/app-state';
import { space } from '@/theme';

const INPUT_LABEL: Record<InputMode, string> = { choice: '4 opciones', type: 'Escribir', map: 'Mapa' };
const LENGTHS = [10, 20, 50, 0];

export default function Setup() {
  const params = useLocalSearchParams<{ rule?: Rule }>();
  const { settings, poolEntities } = useApp();
  const [prompt, setPrompt] = useState<Attr>('flag');
  const [answer, setAnswer] = useState<Attr>('name');
  const [input, setInput] = useState<InputMode>('choice');
  const [rule, setRule] = useState<Rule>(params.rule ?? 'classic');
  const [length, setLength] = useState(20);

  // keep the combination valid
  useEffect(() => {
    if (answer === prompt) setAnswer(ANSWER_ATTRS.find(a => a !== prompt)!);
  }, [prompt, answer]);
  useEffect(() => {
    if (!inputsFor(answer).includes(input)) setInput(inputsFor(answer)[0]);
  }, [answer, input]);

  const eligible = eligibleFor({ prompt, answer, input }, poolEntities).length;

  const start = () =>
    router.push({ pathname: '/play/quiz', params: { prompt, answer, input, rule, n: String(length) } });

  return (
    <Screen edges={[]}>
      <Stack.Screen options={{ title: 'Test' }} />
      <SectionTitle>Te enseño</SectionTitle>
      <Segmented options={PROMPT_ATTRS.map(a => ({ key: a, label: ATTR_LABEL[a] }))} value={prompt} onChange={setPrompt} />

      <SectionTitle>Y respondes con</SectionTitle>
      <Segmented
        options={ANSWER_ATTRS.filter(a => a !== prompt).map(a => ({ key: a, label: ATTR_LABEL[a] }))}
        value={answer}
        onChange={setAnswer}
      />

      {inputsFor(answer).length > 1 && (
        <>
          <SectionTitle>Forma de responder</SectionTitle>
          <Segmented options={inputsFor(answer).map(k => ({ key: k, label: INPUT_LABEL[k] }))} value={input} onChange={setInput} />
        </>
      )}

      <SectionTitle>Modo</SectionTitle>
      <Row wrap>
        {(Object.keys(RULE_LABEL) as Rule[]).map(r => (
          <Chip key={r} label={RULE_LABEL[r]} selected={rule === r} onPress={() => setRule(r)} />
        ))}
      </Row>
      <T variant="caption" muted style={{ marginTop: space.sm }}>{RULE_HELP[rule]}</T>

      {rule === 'classic' && (
        <>
          <SectionTitle>Preguntas</SectionTitle>
          <Row wrap>
            {LENGTHS.map(n => (
              <Chip key={n} label={n ? String(n) : 'Todas'} selected={length === n} onPress={() => setLength(n)} />
            ))}
          </Row>
        </>
      )}

      <Card style={{ marginTop: space.xl }} onPress={() => router.push('/pool')}>
        <T variant="caption" muted>Banderas en juego · toca para cambiar</T>
        <T variant="label">{describePool(settings.pool)}</T>
        <T variant="caption" muted>{eligible} disponibles para esta combinación</T>
      </Card>

      <View style={{ flex: 1 }} />
      <Button title="Empezar" disabled={eligible < 2} onPress={start} style={{ marginTop: space.xl }} />
    </Screen>
  );
}
