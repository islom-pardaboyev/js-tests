import { CodeLoader } from '../components/CodeLoader';
import { AttemptsTable } from '../components/dashboard/AttemptsTable';
import { TestRow } from '../components/dashboard/TestRow';
import { VerifyBanner } from '../components/dashboard/VerifyBanner';
import { tests } from '../data/tests';
import { useAbandonedExam } from '../hooks/useAbandonedExam';
import { useAttempts } from '../hooks/useAttempts';
import { useAuth } from '../hooks/useAuth';
import { usePageMeta } from '../lib/seo';

export default function DashboardPage() {
  const { user } = useAuth();
  const { attempts, loading, error, reload } = useAttempts(user?.uid);
  const abandoned = useAbandonedExam(user, reload);
  const firstName = (user?.displayName ?? user?.email ?? '').split(/[\s@]/)[0];

  usePageMeta({ title: 'My tests', description: 'Your JSTests dashboard: available tests, scores and certificates.', noindex: true });

  return (
    <div className="container grid gap-12 py-10">
      <VerifyBanner />
      {abandoned && (
        <div className="banner error" role="alert">
          <p><strong>An earlier exam was not finished.</strong> <span className="muted">Leaving or reloading counts as a failed attempt. It has been recorded.</span></p>
        </div>
      )}
      <section className="rise grid gap-3">
        <h1>Hello, {firstName}</h1>
        <p className="mono-note">// pick a test. random items, timed, 70% to pass.</p>
      </section>

      {error && (
        <div className="banner error" role="alert">
          <p>Could not load your results. Check that Firestore is set up and the rules are published.</p>
          <button type="button" className="btn btn-sm" onClick={reload}>Try again</button>
        </div>
      )}

      <ul className="test-list" aria-label="Available tests">
        {tests.map((t, i) => (
          <TestRow key={t.id} index={i} test={t} loading={loading} last={attempts.find((a) => a.testId === t.id)} />
        ))}
      </ul>

      <section className="grid gap-4">
        <h2>Previous attempts</h2>
        {loading ? <CodeLoader scope="attempts" compact /> : <AttemptsTable attempts={attempts} />}
      </section>
    </div>
  );
}
