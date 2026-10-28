import { Fragment, useState } from 'react';
import { Link } from 'react-router-dom';
import { testTitle } from '../../data/tests';
import type { Attempt, UserProfile } from '../../lib/db';
import { formatDate, formatDateTime } from '../../lib/format';

interface Props {
  users: UserProfile[];
  attempts: Attempt[];
  query: string;
}

export function AdminUsers({ users, attempts, query }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const rows = users
    .filter((u) => !q || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    .sort((a, b) => b.lastLoginAt - a.lastLoginAt);

  if (rows.length === 0) return <div className="panel empty">No users found.</div>;

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>User</th>
            <th>Registered</th>
            <th>Last sign-in</th>
            <th className="num">Attempts</th>
            <th className="num">Best</th>
            <th className="num">Certificates</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => {
            const mine = attempts.filter((a) => a.uid === u.uid);
            const best = mine.reduce((m, a) => Math.max(m, a.score), 0);
            const isOpen = open === u.uid;
            return (
              <Fragment key={u.uid}>
                <tr>
                  <td>
                    <button type="button" className="btn btn-ghost btn-sm !h-auto !min-h-0 !p-0 text-left" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : u.uid)}>
                      <span className="grid"><strong>{u.displayName || 'Unnamed'}</strong><span className="muted font-normal">{u.email}</span></span>
                    </button>
                  </td>
                  <td className="muted">{formatDate(u.createdAt)}</td>
                  <td className="muted">{formatDateTime(u.lastLoginAt)}</td>
                  <td className="num">{mine.length}</td>
                  <td className="num">{mine.length ? `${best}%` : '—'}</td>
                  <td className="num">{mine.filter((a) => a.certId).length}</td>
                </tr>
                {isOpen && (
                  <tr>
                    <td colSpan={6} className="!bg-[var(--bg-2)]">
                      {mine.length === 0 ? (
                        <p className="muted">This user has no attempts yet.</p>
                      ) : (
                        <ul className="m-0 grid list-none gap-1 p-0">
                          {mine.map((a) => (
                            <li key={a.id} className="flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span className="min-w-[180px]">{testTitle(a.testId)}</span>
                              <strong>{a.score}%</strong>
                              <span className={`chip ${a.passed ? 'pass' : 'fail'}`}>{a.passed ? 'Passed' : 'Not passed'}</span>
                              <span className="muted">{formatDateTime(a.createdAt)}</span>
                              {a.certId && <Link to={`/certificate/${a.certId}`}>Certificate</Link>}
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
