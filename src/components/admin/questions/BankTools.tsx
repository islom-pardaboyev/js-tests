import { useRef, useState } from 'react';
import { parseBankFile } from '../../../lib/bank';
import { upsertBank } from '../../../lib/db';

/** Bulk action: import many questions from a JSON file. */
export function BankTools({ onChanged }: { onChanged: () => void }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const file = useRef<HTMLInputElement>(null);

  const run = async (label: string, fn: () => Promise<number>) => {
    setBusy(true);
    setMessage(null);
    try {
      const n = await fn();
      setMessage({ ok: true, text: `${label}: ${n} question${n === 1 ? '' : 's'} saved.` });
      onChanged();
    } catch {
      setMessage({ ok: false, text: `${label} failed. Check your connection and the admin rules.` });
    } finally {
      setBusy(false);
    }
  };

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    try {
      const { items, rejected } = parseBankFile(JSON.parse(await f.text()));
      if (items.length === 0) return setMessage({ ok: false, text: 'No valid questions found in that file.' });
      await run(rejected ? `Import (${rejected} invalid rows skipped)` : 'Import', async () => {
        await upsertBank(items);
        return items.length;
      });
    } catch {
      setMessage({ ok: false, text: 'That file is not valid JSON.' });
    }
    if (file.current) file.current.value = '';
  };

  return (
    <div className="panel grid gap-3 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn btn-sm" disabled={busy} onClick={() => file.current?.click()}>Import from JSON file</button>
        <input ref={file} type="file" accept="application/json,.json" className="sr-only" onChange={(e) => void onFile(e.target.files?.[0])} aria-label="Choose a JSON file of questions" />
      </div>
      <p className="muted text-[0.8125rem]">The JSON file is an array of question objects, in the same shape the editor saves. Existing ids are overwritten.</p>
      {message && <p className={`banner ${message.ok ? 'ok' : 'error'}`} role="status">{message.text}</p>}
    </div>
  );
}
