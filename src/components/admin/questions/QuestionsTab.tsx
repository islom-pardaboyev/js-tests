import { useCallback, useEffect, useState } from 'react';
import type { BankItem, Level } from '../../../data/types';
import { parseBankItem } from '../../../lib/bank';
import { countBank, deleteQuestion, listBankPage } from '../../../lib/db';
import { draftFromItem, emptyDraft, type Draft } from '../../../lib/questionDraft';
import { PlusIcon } from '../../Icons';
import { CodeLoader } from '../../CodeLoader';
import { BankTools } from './BankTools';
import { QuestionForm } from './QuestionForm';

const LEVELS: { level: Level; label: string }[] = [
  { level: 'easy', label: 'Easy' },
  { level: 'medium', label: 'Medium' },
  { level: 'hard', label: 'Hard' },
];

const title = (q: BankItem): string => (q.level === 'hard' ? q.title : q.prompt);

export function QuestionsTab() {
  const [level, setLevel] = useState<Level>('easy');
  const [rows, setRows] = useState<{ id: string; item: BankItem | null }[]>([]);
  const [next, setNext] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<Level, number> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editing, setEditing] = useState<Draft | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);

  const load = useCallback(async (after: string | null) => {
    setLoading(true);
    setError(false);
    try {
      const page = await listBankPage(level, after);
      const parsed = page.rows.map((r) => ({ id: String(r.id), item: parseBankItem(r) }));
      setRows((prev) => (after ? [...prev, ...parsed] : parsed));
      setNext(page.next);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [level]);

  const refresh = useCallback(() => {
    void load(null);
    countBank().then(setCounts).catch(() => undefined);
  }, [load]);

  useEffect(refresh, [refresh]);

  const remove = async (id: string) => {
    await deleteQuestion(id).catch(() => setError(true));
    setConfirm(null);
    refresh();
  };

  const saved = () => {
    setEditing(null);
    refresh();
  };

  return (
    <div className="grid gap-5">
      <BankTools onChanged={refresh} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="seg !grid-cols-3" role="tablist" aria-label="Difficulty level" style={{ width: 'min(100%, 420px)' }}>
          {LEVELS.map((l) => (
            <button key={l.level} type="button" role="tab" aria-selected={level === l.level} onClick={() => { setLevel(l.level); setEditing(null); }}>
              {l.label}{counts ? ` (${counts[l.level]})` : ''}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setEditing(emptyDraft(level))}><PlusIcon /> Add {level} {level === 'hard' ? 'task' : 'question'}</button>
      </div>

      {editing && <QuestionForm key={editing.id ?? 'new'} initial={editing} onSaved={saved} onCancel={() => setEditing(null)} />}
      {error && <div className="banner error" role="alert">Could not reach the question bank. Check the admin rules and your connection.</div>}

      <div className="table-wrap">
        <table className="data">
          <thead><tr><th>{level === 'hard' ? 'Task' : 'Question'}</th><th>Topic</th><th className="num">Actions</th></tr></thead>
          <tbody>
            {rows.map(({ id, item }) => (
              <tr key={id}>
                <td className="max-w-[420px]"><p className="truncate font-semibold">{item ? title(item) : 'Invalid record'}</p><p className="muted font-mono text-[0.75rem]">{id}</p></td>
                <td>{item ? <span className="chip">{item.topic}</span> : '—'}</td>
                <td className="num">
                  <span className="inline-flex gap-2">
                    {item && <button type="button" className="btn btn-sm" onClick={() => setEditing(draftFromItem(item))}>Edit</button>}
                    {confirm === id ? (
                      <>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => void remove(id)}>Confirm delete</button>
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => setConfirm(null)}>Keep</button>
                      </>
                    ) : (
                      <button type="button" className="btn btn-danger btn-sm" onClick={() => setConfirm(id)}>Delete</button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && <tr><td colSpan={3} className="empty">No {level} questions yet. Add one, import a JSON file, or upload the starter set.</td></tr>}
          </tbody>
        </table>
      </div>
      {loading && <CodeLoader scope="bank" compact />}
      {next && !loading && <button type="button" className="btn w-fit" onClick={() => void load(next)}>Load more</button>}
    </div>
  );
}
