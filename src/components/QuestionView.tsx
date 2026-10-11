import { useState } from 'react';
import { TextInput, useWindowDimensions, View } from 'react-native';

import { BY_ID, type Entity } from '@/data';
import { locate } from '@/lib/geo';
import { checkTyped, type Attr, type QuizConfig, type Question } from '@/lib/quiz';
import { MAX_WIDTH, noOutline, radius, space, useTheme } from '@/theme';
import { Flag } from './Flag';
import { EntityPrompt, OptionTile, PromptBox, type OptionState } from './game';
import { ShapeView } from './ShapeView';
import { Button, Row, T } from './ui';
import { WorldMap } from './WorldMap';

export function questionText(prompt: Attr, answer: Attr, target: Entity): string {
  if (answer === 'map') return prompt === 'name' ? 'Tócalo en el mapa' : prompt === 'capital' ? '¿Dónde está esta capital?' : '¿Dónde está? Tócalo en el mapa';
  if (answer === 'name') return prompt === 'flag' ? '¿De quién es esta bandera?' : prompt === 'capital' ? '¿De qué país es la capital?' : '¿Qué territorio es?';
  if (answer === 'capital') return '¿Cuál es la capital?';
  if (answer === 'flag') return '¿Cuál es su bandera?';
  if (answer === 'shape') return '¿Cuál es su forma?';
  return target.name;
}

interface Props {
  question: Question;
  cfg: QuizConfig;
  /** null while unanswered, then whether the answer was right. */
  answered: boolean | null;
  /** Id of the chosen option / tapped territory ('__none' = sea), or the typed text. */
  picked: string | null;
  onAnswer: (correct: boolean, picked: string | null) => void;
}

/**
 * One question: the prompt (flag, name, capital or shape) and the answer
 * area (4 options, a text field or the map). Shared by the solo test and the
 * online games. Give it a `key` per question so the text field resets.
 */
export function QuestionView({ question, cfg, answered, picked, onAnswer }: Props) {
  const c = useTheme();
  const { width } = useWindowDimensions();
  const contentW = Math.min(width, MAX_WIDTH) - space.lg * 2;
  const [typed, setTyped] = useState('');
  const t = question.target;

  const stateOf = (id: string): OptionState => {
    if (answered === null) return 'idle';
    if (id === t.id) return 'correct';
    if (id === picked) return 'wrong';
    return 'dim';
  };

  const answer = (ok: boolean, p: string | null) => {
    if (answered === null) onAnswer(ok, p);
  };

  const renderOptions = () => {
    if (cfg.answer === 'flag' || cfg.answer === 'shape') {
      const tileW = (contentW - space.md) / 2;
      return (
        <Row wrap gap={space.md}>
          {question.options.map(o => (
            <OptionTile key={o.id} state={stateOf(o.id)} onPress={() => answer(o.id === t.id, o.id)} style={{ width: tileW, height: tileW * 0.72 }}>
              {cfg.answer === 'flag' ? <Flag id={o.id} width={tileW - 24} height={tileW * 0.72 - 24} /> : <ShapeView id={o.id} size={tileW * 0.72 - 20} />}
            </OptionTile>
          ))}
        </Row>
      );
    }
    return (
      <View style={{ gap: space.sm }}>
        {question.options.map(o => (
          <OptionTile key={o.id} state={stateOf(o.id)} onPress={() => answer(o.id === t.id, o.id)} style={{ alignItems: 'flex-start', paddingVertical: 15 }}>
            <T variant="heading" style={{ fontWeight: '500' }}>{cfg.answer === 'capital' ? o.capital : o.name}</T>
          </OptionTile>
        ))}
      </View>
    );
  };

  const correctLabel = cfg.answer === 'capital' ? t.capital : t.name;
  const submitTyped = () => typed.trim() && answer(checkTyped(typed, t, cfg.answer, cfg.prompt), typed.trim());

  return (
    <View>
      <T variant="label" muted center style={{ marginTop: space.lg }}>{questionText(cfg.prompt, cfg.answer, t)}</T>
      <PromptBox>
        <EntityPrompt e={t} attr={cfg.prompt as 'flag'} width={contentW} />
      </PromptBox>

      {cfg.input === 'choice' && renderOptions()}

      {cfg.input === 'type' && (
        <View style={{ gap: space.sm }}>
          <View style={{ borderWidth: answered === null ? 1 : 2, borderColor: answered === null ? c.border : answered ? c.success : c.error, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md }}>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              editable={answered === null}
              autoFocus
              autoCorrect={false}
              placeholder={cfg.answer === 'capital' ? 'Escribe la capital' : 'Escribe el nombre'}
              placeholderTextColor={c.textSecondary}
              onSubmitEditing={submitTyped}
              returnKeyType="send"
              style={[{ fontSize: 18, color: c.text, paddingVertical: 14 }, noOutline]}
            />
          </View>
          {answered === null ? (
            <Row gap={space.sm}>
              <Button title="No lo sé" kind="secondary" style={{ flex: 1 }} onPress={() => answer(false, null)} />
              <Button title="Comprobar" style={{ flex: 1 }} disabled={!typed.trim()} onPress={submitTyped} />
            </Row>
          ) : (
            <T center color={answered ? c.success : c.error} variant="heading">{answered ? '¡Correcto!' : `Era: ${correctLabel}`}</T>
          )}
        </View>
      )}

      {cfg.input === 'map' && (
        <View style={{ gap: space.sm }}>
          <WorldMap
            height={Math.max(260, Math.min(420, contentW * 0.75))}
            onPick={id => answer(id === t.id, id ?? '__none')}
            pin={answered === false ? locate(t.id) : null}
            pinColor={c.success}
            highlights={
              answered === null ? [] : [
                { id: t.id, color: c.success },
                ...(picked && picked !== t.id && picked !== '__none' ? [{ id: picked, color: c.error }] : []),
              ]
            }
          />
          {answered === false && (
            <T center color={c.error} variant="label">
              Era {t.name}{picked && picked !== '__none' ? ` · tocaste ${BY_ID.get(picked)?.name ?? picked}` : ''}
            </T>
          )}
          {answered === null && <T center variant="caption" muted>Pellizca o usa + / − para ampliar</T>}
        </View>
      )}
    </View>
  );
}
