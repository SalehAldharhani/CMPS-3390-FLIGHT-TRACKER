import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
      <p className="mono" style={{ color: 'var(--color-text-faint)' }}>404</p>
      <h1>Lost in the troposphere</h1>
      <p>That page doesn't exist.</p>
      <p><Link to="/">← Back to home</Link></p>
    </div>
  );
}
