import { Link } from 'react-router-dom';
import { testTitle } from '../../data/tests';
import type { Attempt } from '../../lib/db';
import { formatDateTime, formatDuration } from '../../lib/format';

export function statusOf(a: Attempt): { label: string; className: string } {
  if (a.terminated) return { label: 'Terminated', className: 'fail' };
  return a.passed ? { label: 'Passed', className: 'pass' } : { label: 'Not passed', className: 'fail' };
}

export function AttemptsTable({ attempts }: { attempts: Attempt[] }) {
  if (attempts.length === 0) {
    return (
      <div className="panel empty">
        <p className="mono-note">// no attempts yet. pick a test above.</p>
      </div>
    );
  }
  return (
    <div className="table-wrap">
      <table className="data">
        <thead>
          <tr>
            <th>Test</th>
            <th className="num">Score</th>
            <th>Status</th>
            <th>Date</th>
            <th>Duration</th>
            <th>Certificate</th>
          </tr>
        </thead>
        <tbody>
          {attempts.map((a) => {
            const s = statusOf(a);
            return (
              <tr key={a.id}>
                <td>{testTitle(a.testId)}</td>
                <td className="num"><strong>{a.score}%</strong></td>
                <td><span className={`chip ${s.className}`}>{s.label}</span></td>
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
