import { Link } from 'react-router-dom';
import { testTitle } from '../../data/tests';
import type { Attempt } from '../../lib/db';
import { REASON_LABEL } from '../../lib/examGuard';
import { formatDateTime, formatDuration, formatPoints } from '../../lib/format';
import { statusOf } from '../dashboard/AttemptsTable';

export function AdminAttempts({ attempts, query }: { attempts: Attempt[]; query: string }) {
  const q = query.trim().toLowerCase();
  const rows = attempts.filter(
    (a) => !q || a.displayName.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || testTitle(a.testId).toLowerCase().includes(q),
  );
  if (rows.length === 0) return <div className="panel empty">No attempts found.</div>;

  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>User</th><th>Test</th><th className="num">Score</th><th>Status</th>
            <th className="num">Easy / Medium / Hard</th><th>Violations</th><th>Date</th><th>Time</th><th>Certificate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const s = statusOf(a);
            return (
              <tr key={a.id}>
                <td><span className="grid"><strong>{a.displayName}</strong><span className="muted">{a.email}</span></span></td>
                <td>{testTitle(a.testId)}</td>
                <td className="num"><strong>{a.score}%</strong></td>
                <td><span className={`chip ${s.className}`}>{s.label}</span></td>
                <td className="num muted">{formatPoints(a.breakdown.easy.correct)}/{a.breakdown.easy.total} · {formatPoints(a.breakdown.medium.correct)}/{a.breakdown.medium.total} · {formatPoints(a.breakdown.hard.correct)}/{a.breakdown.hard.total}</td>
                <td className="muted">{a.violations?.length ? [...new Set(a.violations)].map((v) => REASON_LABEL[v as keyof typeof REASON_LABEL] ?? v).join(', ') : 'None'}</td>
                <td className="muted">{formatDateTime(a.createdAt)}</td>
                <td className="muted">{formatDuration(a.durationSec)}</td>
                <td>{a.certId ? <Link to={`/certificate/${a.certId}`}>View</Link> : <span className="muted">None</span>}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
