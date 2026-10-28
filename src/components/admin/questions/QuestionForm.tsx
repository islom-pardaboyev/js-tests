import { useState, type FormEvent } from 'react';
import { saveQuestion } from '../../../lib/db';
import { draftToItem, TOPICS, type Draft } from '../../../lib/questionDraft';
import { LevelFields } from './LevelFields';

interface Props {
  initial: Draft;
  onSaved: () => void;
  onCancel: () => void;
}

const LEVEL_NAME = { easy: 'easy', medium: 'medium', hard: 'hard' } as const;

export function QuestionForm({ initial, onSaved, onCancel }: Props) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const editing = initial.id !== null;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const result = draftToItem(draft);
    if (result.item === null) return setError(result.error);
    setSaving(true);
    setError(null);
    try {
      await saveQuestion(result.item);
      onSaved();
    } catch {
      setError('Could not save. Check your connection and that you are signed in as the admin.');
      setSaving(false);
    }
  };

  return (
    <form className="panel grid gap-4 p-5" onSubmit={submit} noValidate aria-label={editing ? 'Edit question' : 'New question'}>
      <h3 className="!text-[1.25rem]">{editing ? 'Edit' : 'New'} {LEVEL_NAME[draft.level]} {draft.level === 'hard' ? 'task' : 'question'}</h3>
      <label className="field">
        <span className="text-[0.8125rem] font-semibold text-[var(--muted)]">Topic</span>
        <select className="input" value={draft.topic} onChange={(e) => set('topic', e.target.value as Draft['topic'])}>
          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </label>
      <LevelFields draft={draft} set={set} />
      {error && <p className="banner error" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary" disabled={saving} aria-busy={saving}>Save</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={saving}>Cancel</button>
      </div>
    </form>
  );
}
