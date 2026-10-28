import { Navigate, useLocation } from 'react-router-dom';
import { AuthForm } from '../components/auth/AuthForm';
import { FullScreenLoader } from '../components/Layouts';
import { useAuth } from '../hooks/useAuth';
import { usePageMeta } from '../lib/seo';

const POINTS = [
  'Predict output, then write functions',
  'Sandboxed live editor, 3 second limit',
  'Pass at 70% for a verifiable certificate',
];

export default function LoginPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';

  usePageMeta({
    title: 'Sign in',
    description: 'Sign in or create a free JSTests account to take the JavaScript exam and earn a verifiable certificate.',
    path: '/login',
  });

  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to={from} replace />;

  return (
    <div className="auth-page container">
      <div className="auth-stack">
        <div className="rise"><AuthForm /></div>
        <ul className="auth-points">
          {POINTS.map((p, i) => (
            <li key={p} className="rise" style={{ '--i': i + 2 } as React.CSSProperties}>{p}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
