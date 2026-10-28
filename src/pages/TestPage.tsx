import { Link, Navigate, useParams } from 'react-router-dom';
import type { User } from 'firebase/auth';
import { SiteFooter } from '../components/Layouts';
import { SiteHeader } from '../components/SiteHeader';
import { CodeLoader } from '../components/CodeLoader';
import { CodingSection } from '../components/test/CodingSection';
import { ExamShell } from '../components/test/ExamShell';
import { QuizSection } from '../components/test/QuizSection';
import { ResultScreen } from '../components/test/ResultScreen';
import { TestIntro } from '../components/test/TestIntro';
import { TypedSection } from '../components/test/TypedSection';
import { getTest } from '../data/tests';
import type { TestDef } from '../data/types';
import { useAuth } from '../hooks/useAuth';
import { useTestSession } from '../hooks/useTestSession';
import { examSize } from '../lib/exam';
import { usePageMeta } from '../lib/seo';

const SECTION: Record<string, string> = {
  easy: 'Easy: choose the answer',
  medium: 'Medium: type the output',
  hard: 'Hard: write the function',
};

/** Normal site chrome for everything outside the running exam. */
function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-bg stage">
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function Runner({ test, user }: { test: TestDef; user: User }) {
  const s = useTestSession(test, user);
  usePageMeta({ title: test.title, description: test.summary, noindex: true });

  if (s.phase === 'loading') return <Page><div className="container py-16"><CodeLoader scope="bank" /></div></Page>;
  if (s.phase === 'intro') {
    return <Page><TestIntro test={test} pool={s.pool} loadError={s.loadError} error={s.error} starting={s.starting} onStart={() => void s.start()} /></Page>;
  }
  if (s.phase === 'finishing') {
    return <Page><div className="container py-16"><CodeLoader scope="grade" /></div></Page>;
  }
  if (s.phase === 'result') {
    return <Page>{s.outcome && <ResultScreen test={test} outcome={s.outcome} onRetrySave={s.retrySave} />}</Page>;
  }

  const exam = s.exam;
  if (!exam) return null;
  return (
    <ExamShell title={test.title} section={SECTION[s.phase]} secondsLeft={s.secondsLeft} answered={s.answered} total={examSize(exam)} lock={s.lock}>
      {s.phase === 'easy' && <QuizSection key="easy" questions={exam.easy} onAnswer={s.recordEasy} onComplete={s.completeEasy} />}
      {s.phase === 'medium' && <TypedSection key="medium" questions={exam.medium} onType={s.recordMedium} onComplete={s.completeMedium} />}
      {s.phase === 'hard' && <CodingSection tasks={exam.hard} codes={s.codes} onCode={s.setCode} onFinish={() => void s.finish()} />}
    </ExamShell>
  );
}

export default function TestPage() {
  const { testId } = useParams();
  const { user } = useAuth();
  const test = getTest(testId);

  if (!user) return <Navigate to="/login" replace />;
  if (!test) {
    return (
      <Page>
        <div className="container grid gap-4 py-16">
          <h1>Test not found</h1>
          <Link to="/dashboard" className="btn w-fit">Back to my tests</Link>
        </div>
      </Page>
    );
  }
  return <Runner key={test.id} test={test} user={user} />;
}
