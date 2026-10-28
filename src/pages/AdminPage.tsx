import { useEffect, useState } from 'react';
import { CodeLoader } from '../components/CodeLoader';
import { AdminAttempts } from '../components/admin/AdminAttempts';
import { AdminUsers } from '../components/admin/AdminUsers';
import { QuestionsTab } from '../components/admin/questions/QuestionsTab';
import { listAllAttempts, listAllUsers, type Attempt, type UserProfile } from '../lib/db';
import { usePageMeta } from '../lib/seo';

type Tab = 'questions' | 'users' | 'attempts';
type Data = { users: UserProfile[]; attempts: Attempt[] };

const TABS: { id: Tab; label: string }[] = [
  { id: 'questions', label: 'Questions' },
  { id: 'users', label: 'Users' },
  { id: 'attempts', label: 'Attempts' },
];

export default function AdminPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>('questions');
  const [query, setQuery] = useState('');
  usePageMeta({ title: 'Admin', description: 'JSTests admin panel.', noindex: true });

  useEffect(() => {
    let cancelled = false;
    Promise.all([listAllUsers(), listAllAttempts()])
      .then(([users, attempts]) => !cancelled && setData({ users, attempts }))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const passed = data?.attempts.filter((a) => a.passed).length ?? 0;

  return (
    <div className="container grid gap-6 py-10">
      <section className="grid gap-2">
        <h1>Admin panel</h1>
        <p className="muted">
          {data ? `${data.users.length} users, ${data.attempts.length} attempts, ${passed} passed.` : 'Manage the question bank, users and results.'}
        </p>
      </section>

      {error && tab !== 'questions' && (
        <div className="banner error" role="alert">
          <p>Could not read users or attempts. Check that firestore.rules is published and your admin email is verified.</p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="seg !grid-cols-3" role="tablist" aria-label="Section" style={{ width: 'min(100%, 420px)' }}>
          {TABS.map((t) => <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>{t.label}</button>)}
        </div>
        {tab !== 'questions' && (
          <input className="input" style={{ width: 'min(100%, 280px)' }} type="search" autoComplete="off" spellCheck={false} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name, email or test" aria-label="Search" />
        )}
      </div>

      {tab === 'questions' && <QuestionsTab />}
      {tab !== 'questions' && !data && !error && <CodeLoader scope="admin" />}
      {data && tab === 'users' && <AdminUsers users={data.users} attempts={data.attempts} query={query} />}
      {data && tab === 'attempts' && <AdminAttempts attempts={data.attempts} query={query} />}
    </div>
  );
}
