import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { CertificateSection } from '../components/landing/CertificateSection';
import { CommandList } from '../components/landing/CommandList';
import { Faq } from '../components/landing/Faq';
import { HeroQuestion } from '../components/landing/HeroQuestion';
import { Stages } from '../components/landing/Stages';
import { ExamRules } from '../components/ExamRules';
import { useAuth } from '../hooks/useAuth';
import { useReveal } from '../lib/motion';
import { usePageMeta } from '../lib/seo';

export default function LandingPage() {
  const { user } = useAuth();
  const root = useRef<HTMLDivElement>(null);
  useReveal(root);

  usePageMeta({
    title: 'JSTests',
    description: 'Predict code output, write functions in a live editor, and earn a certificate anyone can verify by QR code.',
    path: '/',
  });

  return (
    <div ref={root}>
      <section className="hero2">
        <h1 className="hero2-h1">
          <span className="mask"><span>Prove</span></span>
          <span className="mask"><span>your</span></span>
          <span className="mask"><span>JavaScript.</span></span>
        </h1>
        <div className="hero2-foot">
          <p className="hero2-sub">Predict the output, write the function, and keep a certificate anyone can verify.</p>
          <div className="hero2-actions">
            <Link to="/verify" className="btn btn-ghost">Verify a certificate</Link>
            <Link to={user ? '/dashboard' : '/login'} className="btn btn-primary btn-lg">{user ? 'Go to my tests' : 'Start free'}</Link>
          </div>
        </div>
      </section>

      <section className="statement" aria-label="What you do">
        <p>Predict. Write.<br />Certify.</p>
      </section>

      <section className="container demo" aria-labelledby="demo-title">
        <div className="demo-copy reveal">
          <h2 id="demo-title">Try a real question</h2>
          <p>A sample in the same format as the exam. Pick an answer.</p>
        </div>
        <div className="demo-live reveal"><HeroQuestion /></div>
      </section>

      <CommandList />

      <Stages />

      <section className="container grid gap-10 py-16" aria-labelledby="rules-title">
        <div className="reveal grid max-w-[60ch] gap-4">
          <h2 id="rules-title">How the exam is proctored</h2>
          <p className="muted text-[1.0625rem]">The exam locks the browser as far as a web page can. It deters and detects cheating but cannot stop all of it.</p>
        </div>
        <div className="reveal"><ExamRules /></div>
      </section>

      <CertificateSection />

      <Faq />

      <section className="container closing" aria-labelledby="closing-title">
        <h2 id="closing-title" className="closing-h">Take the test. Keep the proof.</h2>
        <Link to={user ? '/dashboard' : '/login'} className="btn btn-primary btn-lg">{user ? 'Go to my tests' : 'Start free'}</Link>
      </section>
    </div>
  );
}
