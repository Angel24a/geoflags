import { useState, type ReactNode } from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

import { savePlayer, type BoardRow } from '@/lib/online/api';
import { onlineConfigured } from '@/lib/online/client';
import { ONLINE_MODES, type OnlineGameConfig } from '@/lib/online/seeded';
import { PRESETS } from '@/lib/pool';
import { useApp } from '@/state/app-state';
import { noOutline, radius, space, useTheme } from '@/theme';
import { formatTime } from './game';
import { Button, Card, Chip, Row, SectionTitle, T } from './ui';

export function NotConfigured() {
  return (
    <Card style={{ gap: space.sm }}>
      <T variant="heading">Modo online sin configurar</T>
      <T muted>
        Esta versión de la app no tiene servidor. Hay que crear un proyecto gratuito en Supabase y añadir sus claves
        (se explica en el README del repositorio). Después, actualiza la app.
      </T>
    </Card>
  );
}

/** Asks for a name before playing online. */
export function NameForm({ onSaved }: { onSaved?: () => void }) {
  const c = useTheme();
  const { profile, setProfileName } = useApp();
  const [name, setName] = useState(profile.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valid = name.trim().length >= 2 && name.trim().length <= 20;

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await savePlayer({ id: profile.id, name: name.trim() });
      setProfileName(name.trim());
      onSaved?.();
    } catch (e) {
      setError(`No se pudo guardar: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ borderWidth: 1, borderColor: c.border, borderRadius: radius.md, backgroundColor: c.surface, paddingHorizontal: space.md }}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre (lo verán tus amigos)"
          placeholderTextColor={c.textSecondary}
          maxLength={20}
          autoCorrect={false}
          style={[{ fontSize: 17, color: c.text, paddingVertical: 12 }, noOutline]}
        />
      </View>
      <Button title={saving ? 'Guardando…' : 'Guardar nombre'} disabled={!valid || saving || name.trim() === profile.name} onPress={save} />
      {error && <T variant="caption" color={c.error}>{error}</T>}
    </View>
  );
}

/** Wraps online screens: shows setup info or the name form when needed. */
export function OnlineGate({ children }: { children: ReactNode }) {
  const { profile } = useApp();
  if (!onlineConfigured) return <NotConfigured />;
  if (!profile.name) {
    return (
      <Card style={{ gap: space.md }}>
        <T variant="heading">Elige tu nombre</T>
        <T muted>Es lo que verán tus amigos en las clasificaciones y partidas.</T>
        <NameForm />
      </Card>
    );
  }
  return <>{children}</>;
}

export function Board({ rows, showTime, emptyText = 'Todavía no hay resultados.' }: { rows: BoardRow[] | null; showTime?: boolean; emptyText?: string }) {
  const c = useTheme();
  const { profile } = useApp();
  if (rows === null) return <ActivityIndicator style={{ marginTop: space.lg }} />;
  if (!rows.length) return <T muted center style={{ marginTop: space.md }}>{emptyText}</T>;
  return (
    <Card style={{ gap: space.sm, paddingVertical: space.md }}>
      {rows.map((r, k) => {
        const me = r.player_id === profile.id;
        return (
          <Row key={r.player_id} gap={space.md} style={{ paddingVertical: 4 }}>
            <T variant="label" style={{ width: 28, textAlign: 'right' }} color={k < 3 ? c.accent : c.textSecondary}>{k + 1}</T>
            <T style={{ flex: 1, fontWeight: me ? '700' : '400' }} numberOfLines={1}>{r.name}{me ? ' (tú)' : ''}</T>
            {showTime && r.time_ms != null && <T variant="caption" muted>{formatTime(r.time_ms / 1000)}</T>}
            <T variant="label">{r.score}</T>
          </Row>
        );
      })}
    </Card>
  );
}

/** Choose the kind of game and the flags for a duel or challenge. */
export function GamePicker({ value, onChange }: { value: OnlineGameConfig; onChange: (c: OnlineGameConfig) => void }) {
  return (
    <View>
      <SectionTitle>Tipo de partida</SectionTitle>
      <Row wrap gap={6}>
        {ONLINE_MODES.map(m => (
          <Chip key={m.key} label={m.label} selected={value.mode === m.key} onPress={() => onChange({ ...value, mode: m.key })} />
        ))}
      </Row>
      <SectionTitle>Banderas</SectionTitle>
      <Row wrap gap={6}>
        {PRESETS.map(p => (
          <Chip key={p.key} label={p.label} selected={value.pool === p.key} onPress={() => onChange({ ...value, pool: p.key })} />
        ))}
      </Row>
      <SectionTitle>Preguntas</SectionTitle>
      <Row wrap gap={6}>
        {[5, 10, 15, 20].map(n => (
          <Chip key={n} label={String(n)} selected={value.count === n} onPress={() => onChange({ ...value, count: n })} />
        ))}
      </Row>
    </View>
  );
}

export function describeGame(cfg: OnlineGameConfig): string {
  const mode = ONLINE_MODES.find(m => m.key === cfg.mode)?.label ?? cfg.mode;
  const pool = PRESETS.find(p => p.key === cfg.pool)?.label ?? cfg.pool;
  return `${mode} · ${pool} · ${cfg.count} preguntas`;
}
