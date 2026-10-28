import { Link, useNavigate } from 'react-router-dom';
import { StatusScreen } from '../components/StatusScreen';
import { usePageMeta } from '../lib/seo';

export default function NotFoundPage() {
  const navigate = useNavigate();
  usePageMeta({ title: 'Page not found', description: 'This page does not exist.', noindex: true });

  return (
    <StatusScreen
      art="404"
      title="Page not found"
      code={`ReferenceError: ${window.location.pathname} is not defined`}
      actions={
        <>
          <Link to="/" className="btn btn-primary">Go home</Link>
          <button type="button" className="btn btn-ghost" onClick={() => navigate(-1)}>Go back</button>
        </>
      }
    >
      The page you were looking for does not exist, or it has moved.
    </StatusScreen>
  );
}
